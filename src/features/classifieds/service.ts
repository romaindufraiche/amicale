import 'server-only'
import { and, eq, isNotNull, isNull, lt } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { sendEmail } from '@/server/mail/transport'
import { db } from '@/server/db/client'
import { classifiedInterests, classifieds } from '@/server/db/schema'
import { env } from '@/server/env'
import { logger } from '@/server/logger'
import { consumeRateLimit } from '@/server/rate-limit'
import { CLASSIFIED_KINDS, CLASSIFIED_LIFETIME_DAYS } from './labels'
import type { ClassifiedInput, ClassifiedInterestInput } from './schemas'

/** Crée ou met à jour une annonce. Retourne `null` si l'annonce à modifier n'existe pas. */
export async function saveClassified(
  actorId: string,
  classifiedId: string | null,
  input: ClassifiedInput,
): Promise<string | null> {
  return db.transaction(async (tx) => {
    if (classifiedId) {
      const updated = await tx
        .update(classifieds)
        .set(input)
        .where(eq(classifieds.id, classifiedId))
        .returning({ id: classifieds.id })
      if (updated.length === 0) return null
      await recordAudit(tx, {
        actorId,
        action: 'classified.updated',
        entityType: 'classified',
        entityId: classifiedId,
      })
      return classifiedId
    }
    const [created] = await tx.insert(classifieds).values(input).returning({ id: classifieds.id })
    if (!created) throw new Error('Insertion d’annonce sans retour')
    await recordAudit(tx, {
      actorId,
      action: 'classified.created',
      entityType: 'classified',
      entityId: created.id,
    })
    return created.id
  })
}

export async function deleteClassified(actorId: string, classifiedId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(classifieds)
      .where(eq(classifieds.id, classifiedId))
      .returning({ id: classifieds.id })
    if (deleted.length === 0) return false
    await recordAudit(tx, {
      actorId,
      action: 'classified.deleted',
      entityType: 'classified',
      entityId: classifiedId,
    })
    return true
  })
}

/**
 * Supprime les annonces publiées depuis plus de 45 jours (et les demandes qui s'y rattachent).
 * Appelé à chaque affichage de la rubrique et par la maintenance quotidienne : aucune tâche
 * planifiée n'est nécessaire.
 */
export async function purgeExpiredClassifieds(now = new Date()): Promise<number> {
  const limit = new Date(now.getTime() - CLASSIFIED_LIFETIME_DAYS * 24 * 60 * 60 * 1000)
  const deleted = await db
    .delete(classifieds)
    .where(lt(classifieds.createdAt, limit))
    .returning({ id: classifieds.id })
  if (deleted.length > 0) logger.info('classified.expired', { count: deleted.length })
  return deleted.length
}

export type InterestResult =
  | { ok: true }
  | { ok: false; reason: 'UNAVAILABLE' }
  | { ok: false; reason: 'RATE_LIMITED'; retryAfterSeconds: number }

/** « Cette annonce m'intéresse » : enregistre la demande et prévient le bureau par email. */
export async function submitClassifiedInterest(
  input: Omit<ClassifiedInterestInput, 'website'>,
  clientIp: string,
): Promise<InterestResult> {
  const limit = await consumeRateLimit(`classified-interest:ip:${clientIp}`, 10, 60 * 60 * 1000)
  if (!limit.allowed) return { ok: false, reason: 'RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds }

  await purgeExpiredClassifieds()
  const [classified] = await db
    .select()
    .from(classifieds)
    .where(and(eq(classifieds.id, input.classifiedId), eq(classifieds.published, true)))
    .limit(1)
  if (!classified) return { ok: false, reason: 'UNAVAILABLE' }

  const [saved] = await db
    .insert(classifiedInterests)
    .values({
      classifiedId: classified.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
    })
    .returning({ id: classifiedInterests.id })
  if (!saved) throw new Error('Insertion de demande sans retour')
  logger.info('classified_interest.received', { interestId: saved.id, classifiedId: classified.id })
  await sendEmail(
    env.BUREAU_EMAIL,
    {
      subject: `Annonce : ${classified.title} — une personne est intéressée`,
      paragraphs: [
        `Annonce : ${classified.title} (${CLASSIFIED_KINDS[classified.kind].label})`,
        `Nom : ${input.lastName}`,
        `Prénom : ${input.firstName}`,
        `Email : ${input.email}`,
        `Téléphone : ${input.phone}`,
        'Vérifiez qu’il s’agit d’un adhérent à jour de cotisation, puis transmettez-lui les coordonnées du vendeur.',
      ],
      action: { label: 'Voir l’annonce', url: `${env.APP_URL}/admin/annonces/${classified.id}` },
    },
    { replyTo: input.email },
  )
  return { ok: true }
}

/** Le bureau indique avoir transmis (ou non) les coordonnées du vendeur. */
export async function setInterestProcessed(actorId: string, interestId: string, processed: boolean) {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(classifiedInterests)
      .set(
        processed
          ? { processedAt: new Date(), processedById: actorId }
          : { processedAt: null, processedById: null },
      )
      .where(
        and(
          eq(classifiedInterests.id, interestId),
          processed ? isNull(classifiedInterests.processedAt) : isNotNull(classifiedInterests.processedAt),
        ),
      )
      .returning({ classifiedId: classifiedInterests.classifiedId })
    const [row] = updated
    if (!row) return null
    await recordAudit(tx, {
      actorId,
      action: processed ? 'classified_interest.processed' : 'classified_interest.unprocessed',
      entityType: 'classified',
      entityId: row.classifiedId,
    })
    return row.classifiedId
  })
}

export async function deleteInterest(actorId: string, interestId: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .delete(classifiedInterests)
      .where(eq(classifiedInterests.id, interestId))
      .returning({ classifiedId: classifiedInterests.classifiedId })
    if (!row) return null
    await recordAudit(tx, {
      actorId,
      action: 'classified_interest.deleted',
      entityType: 'classified',
      entityId: row.classifiedId,
    })
    return row.classifiedId
  })
}
