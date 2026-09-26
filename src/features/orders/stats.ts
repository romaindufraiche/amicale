import 'server-only'
import { count } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { orders, type OrderStatus } from '@/server/db/schema'

export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const rows = await db.select({ status: orders.status, value: count() }).from(orders).groupBy(orders.status)
  const result: Record<OrderStatus, number> = { PENDING_PAYMENT: 0, PAID: 0, DELIVERED: 0, CANCELLED: 0 }
  for (const row of rows) result[row.status] = row.value
  return result
}
