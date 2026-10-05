import 'server-only'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { getPublishedOfferById } from '@/features/offers/queries'
import { offerAvailability } from '@/features/offers/rules'
import { getSiteSettings } from '@/features/settings/queries'
import { parisDay } from '@/lib/dates'
import { db } from '@/server/db/client'
import { offerRequests } from '@/server/db/schema'
import { env } from '@/server/env'
import { logger } from '@/server/logger'
import { sendEmail } from '@/server/mail/transport'
import { consumeRateLimit } from '@/server/rate-limit'
import type { OfferRequestInput } from './schemas'

export type SubmitRequestResult =
  | { ok: true; helloassoUrl: string | null }
  | { ok: false; reason: 'RATE_LIMITED'; retryAfterSeconds: number }
  | { ok: false; reason: 'UNAVAILABLE' }

/**
 * Enregistre une commande, prévient le bureau par email, puis renvoie le lien de paiement
 * HelloAsso de l'offre s'il existe.
 * L'offre est relue en base : un formulaire falsifié ne peut viser ni une offre fermée, ni un
 * autre lien de paiement.
 */
export async function submitOfferRequest(
  input: Omit<OfferRequestInput, 'website'>,
  clientIp: string,
): Promise<SubmitRequestResult> {
  const limit = await consumeRateLimit(`offer-request:ip:${clientIp}`, 10, 60 * 60 * 1000)
  if (!limit.allowed) return { ok: false, reason: 'RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds }

  const offer = await getPublishedOfferById(input.offerId)
  const now = new Date()
  if (!offer || !offerAvailability(offer, offer.tariffs, now, parisDay(now)).open) {
    return { ok: false, reason: 'UNAVAILABLE' }
  }

  const [saved] = await db.insert(offerRequests).values(input).returning({ id: offerRequests.id })
  logger.info('offer_request.received', { requestId: saved?.id, offerId: offer.id })
  const { ordersEmail } = await getSiteSettings()
  await sendEmail(
    ordersEmail ?? env.BUREAU_EMAIL,
    {
      subject: `Nouvelle commande : ${offer.title}`,
      paragraphs: [
        `Offre : ${offer.title}`,
        `Nom : ${input.lastName}`,
        `Prénom : ${input.firstName}`,
        `Email : ${input.email}`,
        offer.helloassoUrl
          ? 'La personne a été dirigée vers la page de paiement HelloAsso de l’offre.'
          : 'Aucun lien de paiement n’est renseigné pour cette offre : recontactez la personne pour le règlement.',
      ],
      action: { label: 'Voir les commandes', url: `${env.APP_URL}/admin/demandes?offre=${offer.id}` },
    },
    { replyTo: input.email },
  )
  return { ok: true, helloassoUrl: offer.helloassoUrl }
}

/** Le bureau indique avoir constaté (ou non) le paiement sur HelloAsso. */
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
