import 'server-only'
import { and, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm'
import { PAGE_SIZE } from '@/lib/pagination'
import { db } from '@/server/db/client'
import { offers, orderLines, orders, users, type OrderStatus } from '@/server/db/schema'

async function linesFor(orderIds: string[]) {
  if (orderIds.length === 0) return []
  return db
    .select({
      orderId: orderLines.orderId,
      label: orderLines.label,
      unitPriceCents: orderLines.unitPriceCents,
      quantity: orderLines.quantity,
    })
    .from(orderLines)
    .where(inArray(orderLines.orderId, orderIds))
}

export type OrderLineView = Awaited<ReturnType<typeof linesFor>>[number]

const orderSummaryColumns = {
  id: orders.id,
  number: orders.number,
  status: orders.status,
  totalCents: orders.totalCents,
  createdAt: orders.createdAt,
  offerTitle: offers.title,
  offerSlug: offers.slug,
  offerKind: offers.kind,
  eventStartsAt: offers.eventStartsAt,
  pickupInfo: offers.pickupInfo,
}

/** Commandes d'un adhérent — toujours filtrées sur son identifiant (pas d'accès croisé). */
export async function listOrdersForUser(userId: string) {
  const rows = await db
    .select(orderSummaryColumns)
    .from(orders)
    .innerJoin(offers, eq(offers.id, orders.offerId))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
  const lines = await linesFor(rows.map((row) => row.id))
  return rows.map((row) => ({ ...row, lines: lines.filter((line) => line.orderId === row.id) }))
}

export type UserOrder = Awaited<ReturnType<typeof listOrdersForUser>>[number]

export async function getOrderForUser(userId: string, orderId: string): Promise<UserOrder | null> {
  const [row] = await db
    .select(orderSummaryColumns)
    .from(orders)
    .innerJoin(offers, eq(offers.id, orders.offerId))
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)
  if (!row) return null
  return { ...row, lines: await linesFor([row.id]) }
}

// ─── Back-office ────────────────────────────────────────────────────────────

export type AdminOrderFilters = { status?: OrderStatus; offerId?: string; search?: string }

function adminWhere(filters: AdminOrderFilters): SQL | undefined {
  const search = filters.search?.trim()
  const pattern = search ? `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%` : null
  const referenceNumber = search ? Number.parseInt(search.replace(/^C-?0*/i, ''), 10) : NaN
  return and(
    filters.status ? eq(orders.status, filters.status) : undefined,
    filters.offerId ? eq(orders.offerId, filters.offerId) : undefined,
    pattern
      ? or(
          ilike(users.lastName, pattern),
          ilike(users.firstName, pattern),
          ilike(users.email, pattern),
          ilike(users.memberNumber, pattern),
          Number.isInteger(referenceNumber) ? eq(orders.number, referenceNumber) : undefined,
        )
      : undefined,
  )
}

const adminColumns = {
  ...orderSummaryColumns,
  paidAt: orders.paidAt,
  deliveredAt: orders.deliveredAt,
  memberFirstName: users.firstName,
  memberLastName: users.lastName,
  memberEmail: users.email,
  memberPhone: users.phone,
  memberNumber: users.memberNumber,
}

export async function listOrdersForAdmin(filters: AdminOrderFilters, page: number) {
  const where = adminWhere(filters)
  const [rows, [total]] = await Promise.all([
    db
      .select(adminColumns)
      .from(orders)
      .innerJoin(offers, eq(offers.id, orders.offerId))
      .innerJoin(users, eq(users.id, orders.userId))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(orders).innerJoin(users, eq(users.id, orders.userId)).where(where),
  ])
  const lines = await linesFor(rows.map((row) => row.id))
  return {
    total: total?.value ?? 0,
    rows: rows.map((row) => ({ ...row, lines: lines.filter((line) => line.orderId === row.id) })),
  }
}

export type AdminOrder = Awaited<ReturnType<typeof listOrdersForAdmin>>['rows'][number]

/** Toutes les commandes correspondant aux filtres, pour l'export CSV (plafonné). */
export async function exportOrdersForAdmin(filters: AdminOrderFilters) {
  const rows = await db
    .select(adminColumns)
    .from(orders)
    .innerJoin(offers, eq(offers.id, orders.offerId))
    .innerJoin(users, eq(users.id, orders.userId))
    .where(adminWhere(filters))
    .orderBy(desc(orders.createdAt))
    .limit(5000)
  const lines = await linesFor(rows.map((row) => row.id))
  return rows.map((row) => ({ ...row, lines: lines.filter((line) => line.orderId === row.id) }))
}

export async function getOrderNotificationData(orderId: string) {
  const [row] = await db
    .select({
      number: orders.number,
      status: orders.status,
      totalCents: orders.totalCents,
      offerTitle: offers.title,
      pickupInfo: offers.pickupInfo,
      email: users.email,
      firstName: users.firstName,
    })
    .from(orders)
    .innerJoin(offers, eq(offers.id, orders.offerId))
    .innerJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.id, orderId))
    .limit(1)
  return row ?? null
}
