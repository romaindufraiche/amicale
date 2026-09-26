import 'server-only'
import { eq, lt, sql } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { rateLimits } from '@/server/db/schema'

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

/**
 * Fenêtre fixe stockée en base : fonctionne avec plusieurs instances de l'application.
 * L'incrément est atomique (un seul `INSERT … ON CONFLICT`).
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + windowMs)
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= now() then excluded.reset_at else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt })

  if (!row) return { allowed: true, retryAfterSeconds: 0 }
  const retryAfterSeconds = Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000))
  return { allowed: row.count <= limit, retryAfterSeconds }
}

export async function resetRateLimit(key: string): Promise<void> {
  await db.delete(rateLimits).where(eq(rateLimits.key, key))
}

export async function purgeExpiredRateLimits(): Promise<number> {
  const deleted = await db
    .delete(rateLimits)
    .where(lt(rateLimits.resetAt, new Date()))
    .returning({ key: rateLimits.key })
  return deleted.length
}

export function formatRetryAfter(seconds: number): string {
  const minutes = Math.ceil(seconds / 60)
  return minutes <= 1 ? 'dans une minute' : `dans ${minutes} minutes`
}
