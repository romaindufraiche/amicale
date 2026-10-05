import 'server-only'
import { and, asc, count, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { offerRequests, offers } from '@/server/db/schema'
import type { AdminRequestFilters } from './schemas'

function filterConditions(filters: AdminRequestFilters) {
  return and(
    filters.status === 'a-regler'
      ? isNull(offerRequests.paidAt)
      : filters.status === 'reglees'
        ? isNotNull(offerRequests.paidAt)
        : undefined,
    filters.offerId ? eq(offerRequests.offerId, filters.offerId) : undefined,
  )
}

const requestColumns = {
  id: offerRequests.id,
  firstName: offerRequests.firstName,
  lastName: offerRequests.lastName,
  email: offerRequests.email,
  phone: offerRequests.phone,
  paidAt: offerRequests.paidAt,
  createdAt: offerRequests.createdAt,
  offerId: offers.id,
  offerTitle: offers.title,
  offerHelloassoUrl: offers.helloassoUrl,
}

export async function listRequestsForAdmin(filters: AdminRequestFilters, limit = 300) {
  return db
    .select(requestColumns)
    .from(offerRequests)
    .innerJoin(offers, eq(offers.id, offerRequests.offerId))
    .where(filterConditions(filters))
    .orderBy(desc(offerRequests.createdAt))
    .limit(limit)
}

export type AdminRequestRow = Awaited<ReturnType<typeof listRequestsForAdmin>>[number]

/** Export : toutes les demandes correspondant aux filtres, sans limite d'affichage. */
export async function exportRequestsForAdmin(filters: AdminRequestFilters) {
  return db
    .select(requestColumns)
    .from(offerRequests)
    .innerJoin(offers, eq(offers.id, offerRequests.offerId))
    .where(filterConditions(filters))
    .orderBy(asc(offers.title), desc(offerRequests.createdAt))
}

/** Offres ayant reçu au moins une demande, pour le filtre de la liste. */
export async function listOffersWithRequests() {
  return db
    .selectDistinct({ id: offers.id, title: offers.title })
    .from(offers)
    .innerJoin(offerRequests, eq(offerRequests.offerId, offers.id))
    .orderBy(asc(offers.title))
}

export async function countUnpaidRequests(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(offerRequests).where(isNull(offerRequests.paidAt))
  return row?.value ?? 0
}
