import 'server-only'
import { and, asc, desc, eq, gt, lt, notInArray, sql } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { db, type Transaction } from '@/server/db/client'
import { offers, offerTariffs, type PublicationStatus } from '@/server/db/schema'
import type { OfferInput } from './schemas'
import { isUniqueViolation } from '@/server/db/errors'

export type OfferSaveResult = { ok: true; offerId: string } | { ok: false; field?: string; message: string }

function offerColumns(input: OfferInput) {
  return {
    title: input.title,
    slug: input.slug,
    kind: input.kind,
    category: input.category,
    summary: input.summary,
    description: input.description,
    providerUrl: input.providerUrl,
    attachmentId: input.attachmentId,
    eTickets: input.eTickets,
    pickupInfo: input.pickupInfo,
    // Le lieu concerne les sorties (et les offres « Autre ») ; une validité, les billets.
    location: input.kind === 'TICKET' ? null : input.location,
    eventStartsAt: input.kind === 'EVENT' ? input.eventStartsAt : null,
    validUntil: input.kind === 'EVENT' ? null : input.validUntil,
    orderDeadline: input.orderDeadline,
    imageId: input.imageId,
    featured: input.featured,
    pricesPublic: input.pricesPublic,
    orderable: input.orderable,
  }
}

async function saveTariffs(tx: Transaction, offerId: string, tariffs: OfferInput['tariffs']): Promise<void> {
  // Tarifs retirés du formulaire : supprimés.
  const keptIds = tariffs.flatMap((tariff) => (tariff.id ? [tariff.id] : []))
  const removed = await tx
    .select({ id: offerTariffs.id })
    .from(offerTariffs)
    .where(
      and(
        eq(offerTariffs.offerId, offerId),
        keptIds.length > 0 ? notInArray(offerTariffs.id, keptIds) : undefined,
      ),
    )
  for (const { id } of removed) {
    await tx.delete(offerTariffs).where(eq(offerTariffs.id, id))
  }

  for (const [position, tariff] of tariffs.entries()) {
    const values = {
      label: tariff.label,
      memberPriceCents: tariff.memberPrice,
      publicPriceCents: tariff.publicPrice,
      stock: tariff.stock,
      active: tariff.active,
      position,
    }
    if (tariff.id) {
      // Le filtre sur l'offre empêche de modifier le tarif d'une autre offre.
      const updated = await tx
        .update(offerTariffs)
        .set(values)
        .where(and(eq(offerTariffs.id, tariff.id), eq(offerTariffs.offerId, offerId)))
        .returning({ id: offerTariffs.id })
      if (updated.length === 0) throw new Error('Tarif inconnu pour cette offre')
    } else {
      await tx.insert(offerTariffs).values({ ...values, offerId })
    }
  }
}

export async function createOffer(actorId: string, input: OfferInput): Promise<OfferSaveResult> {
  try {
    const offerId = await db.transaction(async (tx) => {
      // Une nouvelle offre apparaît en tête ; le bureau la déplace ensuite s'il le souhaite.
      const [first] = await tx
        .select({ value: sql<number>`coalesce(min(${offers.position}), 1)` })
        .from(offers)
      const [offer] = await tx
        .insert(offers)
        .values({ ...offerColumns(input), position: (first?.value ?? 1) - 1 })
        .returning({ id: offers.id })
      if (!offer) throw new Error('Insertion d’offre sans retour')
      await saveTariffs(tx, offer.id, input.tariffs)
      await recordAudit(tx, {
        actorId,
        action: 'offer.created',
        entityType: 'offer',
        entityId: offer.id,
        details: { title: input.title },
      })
      return offer.id
    })
    return { ok: true, offerId }
  } catch (error) {
    if (isUniqueViolation(error, 'offers_slug_key'))
      return { ok: false, field: 'slug', message: 'Cette adresse de page est déjà utilisée.' }
    throw error
  }
}

export async function updateOffer(
  actorId: string,
  offerId: string,
  input: OfferInput,
): Promise<OfferSaveResult> {
  try {
    const found = await db.transaction(async (tx) => {
      const updated = await tx
        .update(offers)
        .set(offerColumns(input))
        .where(eq(offers.id, offerId))
        .returning({ id: offers.id })
      if (updated.length === 0) return false
      await saveTariffs(tx, offerId, input.tariffs)
      await recordAudit(tx, { actorId, action: 'offer.updated', entityType: 'offer', entityId: offerId })
      return true
    })
    return found ? { ok: true, offerId } : { ok: false, message: 'Offre introuvable.' }
  } catch (error) {
    if (isUniqueViolation(error, 'offers_slug_key'))
      return { ok: false, field: 'slug', message: 'Cette adresse de page est déjà utilisée.' }
    throw error
  }
}

export async function setOfferStatus(
  actorId: string,
  offerId: string,
  status: PublicationStatus,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ publishedAt: offers.publishedAt })
      .from(offers)
      .where(eq(offers.id, offerId))
      .for('update')
    if (!current) return false
    await tx
      .update(offers)
      .set({
        status,
        publishedAt: status === 'PUBLISHED' ? (current.publishedAt ?? new Date()) : current.publishedAt,
      })
      .where(eq(offers.id, offerId))
    await recordAudit(tx, {
      actorId,
      action: 'offer.status_changed',
      entityType: 'offer',
      entityId: offerId,
      details: { status },
    })
    return true
  })
}

/**
 * Monte ou descend une offre d'un cran parmi les offres de la même catégorie
 * (échange de position avec sa voisine). Renvoie `false` si elle est déjà en bout de liste.
 */
export async function moveOffer(
  actorId: string,
  offerId: string,
  direction: 'up' | 'down',
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ id: offers.id, position: offers.position, category: offers.category })
      .from(offers)
      .where(eq(offers.id, offerId))
      .for('update')
    if (!current) return false
    const [neighbor] = await tx
      .select({ id: offers.id, position: offers.position })
      .from(offers)
      .where(
        and(
          eq(offers.category, current.category),
          direction === 'up' ? lt(offers.position, current.position) : gt(offers.position, current.position),
        ),
      )
      .orderBy(direction === 'up' ? desc(offers.position) : asc(offers.position))
      .limit(1)
      .for('update')
    if (!neighbor) return false
    await tx.update(offers).set({ position: neighbor.position }).where(eq(offers.id, current.id))
    await tx.update(offers).set({ position: current.position }).where(eq(offers.id, neighbor.id))
    await recordAudit(tx, { actorId, action: 'offer.moved', entityType: 'offer', entityId: offerId })
    return true
  })
}
