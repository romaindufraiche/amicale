import 'server-only'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { getPublishedOfferById } from '@/features/offers/queries'
import { offerAvailability } from '@/features/offers/rules'
import { getSiteSettings } from '@/features/settings/queries'
import { parisDay } from '@/lib/dates'
import { formatPrice } from '@/lib/money'
import { db } from '@/server/db/client'
import { offerRequests, type RequestLine } from '@/server/db/schema'
import { env } from '@/server/env'
import { logger } from '@/server/logger'
import { sendEmail } from '@/server/mail/transport'
import { consumeRateLimit } from '@/server/rate-limit'
import type { OfferRequestInput } from './schemas'

export type SubmitRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; reason: 'RATE_LIMITED'; retryAfterSeconds: number }
  | { ok: false; reason: 'UNAVAILABLE' | 'INVALID_TARIFF' | 'STOCK' }

/** « 2 × Adulte (12,00 €), 1 × Enfant (8,00 €) » */
export function formatRequestLines(lines: readonly RequestLine[]): string {
  return lines
    .map(
      (line) =>
        `${line.quantity} × ${line.label}${line.unitPriceCents === undefined ? '' : ` (${formatPrice(line.unitPriceCents)})`}`,
    )
    .join(', ')
}

/** Total d'une commande en centimes ; `null` pour une commande passée avant l'enregistrement des prix. */
export function requestTotalCents(lines: readonly RequestLine[]): number | null {
  if (lines.length === 0 || lines.some((line) => line.unitPriceCents === undefined)) return null
  return lines.reduce((total, line) => total + line.quantity * (line.unitPriceCents ?? 0), 0)
}

/**
 * Enregistre une commande puis prévient le bureau par email.
 * L'offre et ses tarifs sont relus en base : un formulaire falsifié ne peut viser ni une offre
 * fermée ou sans commande, ni le tarif d'une autre offre.
 */
export async function submitOfferRequest(
  input: Omit<OfferRequestInput, 'website'>,
  clientIp: string,
): Promise<SubmitRequestResult> {
  const limit = await consumeRateLimit(`offer-request:ip:${clientIp}`, 10, 60 * 60 * 1000)
  if (!limit.allowed) return { ok: false, reason: 'RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds }

  const offer = await getPublishedOfferById(input.offerId)
  const now = new Date()
  if (!offer || !offer.orderable || !offerAvailability(offer, offer.tariffs, now, parisDay(now)).open) {
    return { ok: false, reason: 'UNAVAILABLE' }
  }

  const lines: RequestLine[] = []
  for (const { tariffId, quantity } of input.quantities) {
    if (quantity === 0) continue
    const tariff = offer.tariffs.find((candidate) => candidate.id === tariffId && candidate.active)
    if (!tariff) return { ok: false, reason: 'INVALID_TARIFF' }
    if (tariff.stock !== null && quantity > tariff.stock) return { ok: false, reason: 'STOCK' }
    lines.push({ label: tariff.label, quantity, unitPriceCents: tariff.memberPriceCents })
  }
  const quantity = lines.reduce((total, line) => total + line.quantity, 0)

  const [saved] = await db
    .insert(offerRequests)
    .values({
      offerId: offer.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      quantity,
      lines,
    })
    .returning({ id: offerRequests.id })
  if (!saved) throw new Error('Insertion de commande sans retour')
  logger.info('offer_request.received', { requestId: saved.id, offerId: offer.id, quantity })
  const { ordersEmail } = await getSiteSettings()
  await sendEmail(
    ordersEmail ?? env.BUREAU_EMAIL,
    {
      subject: `Nouvelle commande : ${offer.title}`,
      paragraphs: [
        `Offre : ${offer.title}`,
        `Billets : ${formatRequestLines(lines)} (${quantity} au total)`,
        `Total : ${formatPrice(requestTotalCents(lines) ?? 0)}`,
        `Nom : ${input.lastName}`,
        `Prénom : ${input.firstName}`,
        `Email : ${input.email}`,
      ],
      action: { label: 'Voir les commandes', url: `${env.APP_URL}/admin/demandes?offre=${offer.id}` },
    },
    { replyTo: input.email },
  )
  return { ok: true, requestId: saved.id }
}

/** Le bureau indique avoir reçu (ou non) le règlement. */
export async function setRequestPaid(actorId: string, requestId: string, paid: boolean): Promise<boolean> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(offerRequests)
      .set(paid ? { paidAt: new Date(), paidMarkedById: actorId } : { paidAt: null, paidMarkedById: null })
      .where(
        and(
          eq(offerRequests.id, requestId),
          paid ? isNull(offerRequests.paidAt) : isNotNull(offerRequests.paidAt),
        ),
      )
      .returning({ id: offerRequests.id })
    if (updated.length === 0) return false
    await recordAudit(tx, {
      actorId,
      action: paid ? 'offer_request.paid' : 'offer_request.unpaid',
      entityType: 'offer_request',
      entityId: requestId,
    })
    return true
  })
}

/** Marque une commande comme traitée (ou la repasse en non traitée). Faux si rien n'a changé. */
export async function setRequestProcessed(
  actorId: string,
  requestId: string,
  processed: boolean,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(offerRequests)
      .set(
        processed
          ? { processedAt: new Date(), processedById: actorId }
          : { processedAt: null, processedById: null },
      )
      .where(
        and(
          eq(offerRequests.id, requestId),
          processed ? isNull(offerRequests.processedAt) : isNotNull(offerRequests.processedAt),
        ),
      )
      .returning({ id: offerRequests.id })
    if (updated.length === 0) return false
    await recordAudit(tx, {
      actorId,
      action: processed ? 'offer_request.processed' : 'offer_request.unprocessed',
      entityType: 'offer_request',
      entityId: requestId,
    })
    return true
  })
}

export async function deleteRequest(actorId: string, requestId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(offerRequests)
      .where(eq(offerRequests.id, requestId))
      .returning({ id: offerRequests.id })
    if (deleted.length === 0) return false
    await recordAudit(tx, {
      actorId,
      action: 'offer_request.deleted',
      entityType: 'offer_request',
      entityId: requestId,
    })
    return true
  })
}
