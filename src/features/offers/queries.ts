import 'server-only'
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { db } from '@/server/db/client'
import {
  offers,
  offerTariffs,
  orderLines,
  orders,
  type OfferCategory,
  type PublicationStatus,
} from '@/server/db/schema'

const tariffColumns = {
  id: offerTariffs.id,
  offerId: offerTariffs.offerId,
  label: offerTariffs.label,
  memberPriceCents: offerTariffs.memberPriceCents,
  publicPriceCents: offerTariffs.publicPriceCents,
  stock: offerTariffs.stock,
  active: offerTariffs.active,
  position: offerTariffs.position,
}

async function tariffsFor(offerIds: string[]) {
  if (offerIds.length === 0) return []
  return db
    .select(tariffColumns)
    .from(offerTariffs)
    .where(inArray(offerTariffs.offerId, offerIds))
    .orderBy(asc(offerTariffs.position), asc(offerTariffs.createdAt))
}

export type OfferTariffView = Awaited<ReturnType<typeof tariffsFor>>[number]

export type OfferSort = 'date' | 'prix' | 'recent'

export type CatalogFilters = { category?: OfferCategory; search?: string; sort?: OfferSort }

/**
 * Offres en ligne du catalogue. Par défaut, les sorties datées d'abord puis les plus récentes.
 * Le tri par prix se fait après chargement (le prix d'appel dépend des tarifs actifs).
 */
export async function listPublishedOffers(filters: CatalogFilters = {}) {
  const search = filters.search?.trim()
  const pattern = search ? `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%` : null
  const rows = await db
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.status, 'PUBLISHED'),
        filters.category ? eq(offers.category, filters.category) : undefined,
        pattern
          ? or(ilike(offers.title, pattern), ilike(offers.summary, pattern), ilike(offers.location, pattern))
          : undefined,
      ),
    )
    .orderBy(
      ...(filters.sort === 'recent'
        ? [desc(offers.publishedAt)]
        : [sql`${offers.eventStartsAt} asc nulls last`, desc(offers.publishedAt)]),
    )
  const tariffs = await tariffsFor(rows.map((row) => row.id))
  const result = rows.map((offer) => ({
    ...offer,
    tariffs: tariffs.filter((tariff) => tariff.offerId === offer.id),
  }))
  if (filters.sort === 'prix') {
    const price = (offer: (typeof result)[number]) =>
      Math.min(
        ...offer.tariffs.filter((tariff) => tariff.active).map((tariff) => tariff.memberPriceCents),
        Infinity,
      )
    result.sort((a, b) => price(a) - price(b))
  }
  return result
}

export type OfferWithTariffs = Awaited<ReturnType<typeof listPublishedOffers>>[number]

export async function getPublishedOfferBySlug(slug: string): Promise<OfferWithTariffs | null> {
  const [offer] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.slug, slug), eq(offers.status, 'PUBLISHED')))
    .limit(1)
  if (!offer) return null
  return { ...offer, tariffs: await tariffsFor([offer.id]) }
}

/** Nombre de billets déjà commandés (hors annulations) par un adhérent pour une offre. */
export async function quantityOrderedBy(userId: string, offerId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${orderLines.quantity}), 0)::int` })
    .from(orderLines)
    .innerJoin(orders, eq(orders.id, orderLines.orderId))
    .where(and(eq(orders.userId, userId), eq(orders.offerId, offerId), sql`${orders.status} <> 'CANCELLED'`))
  return row?.total ?? 0
}

// ─── Back-office ────────────────────────────────────────────────────────────

export async function listOffersForAdmin(status?: PublicationStatus) {
  const rows = await db
    .select({
      id: offers.id,
      title: offers.title,
      slug: offers.slug,
      kind: offers.kind,
      category: offers.category,
      status: offers.status,
      featured: offers.featured,
      pricesPublic: offers.pricesPublic,
      eventStartsAt: offers.eventStartsAt,
      orderDeadline: offers.orderDeadline,
      updatedAt: offers.updatedAt,
      ordersCount: sql<number>`(select count(*)::int from ${orders} where ${orders.offerId} = ${offers.id} and ${orders.status} <> 'CANCELLED')`,
    })
    .from(offers)
    .where(status ? eq(offers.status, status) : undefined)
    .orderBy(desc(offers.updatedAt))
  return rows
}

export async function getOfferForAdmin(id: string): Promise<OfferWithTariffs | null> {
  const [offer] = await db.select().from(offers).where(eq(offers.id, id)).limit(1)
  if (!offer) return null
  return { ...offer, tariffs: await tariffsFor([offer.id]) }
}

/** Identifiants des tarifs déjà utilisés dans une commande (non supprimables). */
export async function tariffIdsWithOrders(offerId: string): Promise<Set<string>> {
  const rows = await db
    .selectDistinct({ tariffId: orderLines.tariffId })
    .from(orderLines)
    .innerJoin(offerTariffs, eq(offerTariffs.id, orderLines.tariffId))
    .where(eq(offerTariffs.offerId, offerId))
  return new Set(rows.map((row) => row.tariffId))
}
