import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { hasValidMembership } from '@/features/members/membership'
import { offerAvailability, AVAILABILITY_LABELS } from '@/features/offers/rules'
import { parisDay } from '@/lib/dates'
import { db, type Transaction } from '@/server/db/client'
import { offers, offerTariffs, orderLines, orders, users, type OrderStatus } from '@/server/db/schema'
import { logger } from '@/server/logger'
import { isUniqueViolation } from '@/server/db/errors'
import {
  canTransition,
  describePricingError,
  priceOrder,
  releasesStockOnCancel,
  type RequestedLine,
} from './rules'

/** Erreur métier : son message est destiné à l'adhérent. Elle annule la transaction en cours. */
export class OrderError extends Error {
  override name = 'OrderError'
}

async function findByIdempotencyKey(userId: string, key: string) {
  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, key)))
    .limit(1)
  return existing ?? null
}

export type CreateOrderInput = {
  userId: string
  offerId: string
  lines: RequestedLine[]
  idempotencyKey: string
}

/**
 * Crée une commande de manière atomique :
 * - rejouer la même soumission (double clic, rechargement) renvoie la commande existante ;
 * - l'adhérent est verrouillé pendant la transaction : deux commandes simultanées
 *   ne peuvent pas contourner la limite par adhérent ;
 * - les tarifs sont verrouillés : le stock ne peut pas devenir négatif ;
 * - les prix viennent exclusivement de la base.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; created: boolean }> {
  const existing = await findByIdempotencyKey(input.userId, input.idempotencyKey)
  if (existing) return { orderId: existing.id, created: false }

  try {
    const orderId = await db.transaction(async (tx) => {
      const [member] = await tx
        .select({ status: users.status, membershipValidUntil: users.membershipValidUntil })
        .from(users)
        .where(eq(users.id, input.userId))
        .for('update')
      if (!member || !hasValidMembership(member, parisDay())) {
        throw new OrderError(
          'Votre adhésion doit être à jour pour commander. Contactez le bureau pour renouveler votre cotisation.',
        )
      }

      const [offer] = await tx.select().from(offers).where(eq(offers.id, input.offerId)).limit(1)
      if (!offer) throw new OrderError("Cette offre n'existe plus.")

      const tariffs = await tx
        .select()
        .from(offerTariffs)
        .where(eq(offerTariffs.offerId, offer.id))
        .orderBy(offerTariffs.id)
        .for('update')

      const availability = offerAvailability(offer, tariffs, new Date(), parisDay())
      if (!availability.open) throw new OrderError(AVAILABILITY_LABELS[availability.reason])

      const [already] = await tx
        .select({ total: sql<number>`coalesce(sum(${orderLines.quantity}), 0)::int` })
        .from(orderLines)
        .innerJoin(orders, eq(orders.id, orderLines.orderId))
        .where(
          and(
            eq(orders.userId, input.userId),
            eq(orders.offerId, offer.id),
            sql`${orders.status} <> 'CANCELLED'`,
          ),
        )

      const pricing = priceOrder({
        offerId: offer.id,
        requested: input.lines,
        tariffs,
        maxPerMember: offer.maxPerMember,
        alreadyOrdered: already?.total ?? 0,
      })
      if (!pricing.ok) throw new OrderError(describePricingError(pricing.error))

      for (const line of pricing.lines) {
        await tx
          .update(offerTariffs)
          .set({ stock: sql`${offerTariffs.stock} - ${line.quantity}` })
          .where(and(eq(offerTariffs.id, line.tariffId), sql`${offerTariffs.stock} is not null`))
      }

      const [order] = await tx
        .insert(orders)
        .values({
          userId: input.userId,
          offerId: offer.id,
          totalCents: pricing.totalCents,
          idempotencyKey: input.idempotencyKey,
        })
        .returning({ id: orders.id })
      if (!order) throw new Error('Insertion de commande sans retour')

      await tx.insert(orderLines).values(pricing.lines.map((line) => ({ ...line, orderId: order.id })))
      return order.id
    })

    logger.info('order.created', { orderId, userId: input.userId })
    return { orderId, created: true }
  } catch (error) {
    // Deux soumissions simultanées de la même clé : la seconde retrouve la première.
    if (isUniqueViolation(error)) {
      const raced = await findByIdempotencyKey(input.userId, input.idempotencyKey)
      if (raced) return { orderId: raced.id, created: false }
    }
    throw error
  }
}

async function restoreStock(tx: Transaction, orderId: string): Promise<void> {
  const lines = await tx
    .select({ tariffId: orderLines.tariffId, quantity: orderLines.quantity })
    .from(orderLines)
    .where(eq(orderLines.orderId, orderId))
  for (const line of lines) {
    await tx
      .update(offerTariffs)
      .set({ stock: sql`${offerTariffs.stock} + ${line.quantity}` })
      .where(and(eq(offerTariffs.id, line.tariffId), sql`${offerTariffs.stock} is not null`))
  }
}

const STATUS_TIMESTAMP: Partial<Record<OrderStatus, 'paidAt' | 'deliveredAt' | 'cancelledAt'>> = {
  PAID: 'paidAt',
  DELIVERED: 'deliveredAt',
  CANCELLED: 'cancelledAt',
}

type TransitionResult = { ok: true; userId: string; number: number } | { ok: false; message: string }

async function transition(
  orderId: string,
  to: OrderStatus,
  options: { ownerId?: string; onlyFrom?: OrderStatus; actorId?: string },
): Promise<TransitionResult> {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select({ id: orders.id, status: orders.status, userId: orders.userId, number: orders.number })
      .from(orders)
      .where(
        options.ownerId
          ? and(eq(orders.id, orderId), eq(orders.userId, options.ownerId))
          : eq(orders.id, orderId),
      )
      .for('update')
    // Commande d'un autre adhérent : même réponse qu'une commande inexistante.
    if (!order) return { ok: false, message: 'Commande introuvable.' }
    if (options.onlyFrom && order.status !== options.onlyFrom) {
      return {
        ok: false,
        message: 'Une commande réglée ne peut être annulée que par le bureau. Contactez-le.',
      }
    }
    if (!canTransition(order.status, to)) {
      return { ok: false, message: 'Cette commande a déjà changé de statut. Rechargez la page.' }
    }

    if (to === 'CANCELLED' && releasesStockOnCancel(order.status)) await restoreStock(tx, order.id)

    const timestampField = STATUS_TIMESTAMP[to]
    await tx
      .update(orders)
      .set({
        status: to,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
      })
      .where(eq(orders.id, order.id))

    if (options.actorId) {
      await recordAudit(tx, {
        actorId: options.actorId,
        action: 'order.status_changed',
        entityType: 'order',
        entityId: order.id,
        details: { from: order.status, to },
      })
    }
    return { ok: true, userId: order.userId, number: order.number }
  })
}

/** Annulation par l'adhérent, possible uniquement avant règlement. */
export async function cancelOwnOrder(userId: string, orderId: string): Promise<TransitionResult> {
  return transition(orderId, 'CANCELLED', { ownerId: userId, onlyFrom: 'PENDING_PAYMENT' })
}

/** Changement de statut par le bureau (règlement reçu, billets remis, annulation). */
export async function changeOrderStatus(
  actorId: string,
  orderId: string,
  to: OrderStatus,
): Promise<TransitionResult> {
  return transition(orderId, to, { actorId })
}
