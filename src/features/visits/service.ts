import 'server-only'
import { createHash } from 'node:crypto'
import { gte, sql, sum } from 'drizzle-orm'
import { parisDay } from '@/lib/dates'
import { db } from '@/server/db/client'
import { siteVisits } from '@/server/db/schema'
import { consumeRateLimit } from '@/server/rate-limit'

/** Une même personne n'est comptée qu'une fois par période de 30 minutes. */
const VISIT_WINDOW_MS = 30 * 60 * 1000

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|java\//i

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent)
}

/**
 * Compte une visite. L'adresse IP et le navigateur ne sont jamais enregistrés tels quels :
 * seule une empreinte, conservée 30 minutes pour éviter les doublons, est utilisée.
 */
export async function recordVisit(clientIp: string, userAgent: string | null): Promise<boolean> {
  if (isBot(userAgent)) return false
  const fingerprint = createHash('sha256').update(`${clientIp}|${userAgent}`).digest('hex').slice(0, 32)
  const limit = await consumeRateLimit(`visit:${fingerprint}`, 1, VISIT_WINDOW_MS)
  if (!limit.allowed) return false
  await db
    .insert(siteVisits)
    .values({ day: parisDay(), visits: 1 })
    .onConflictDoUpdate({ target: siteVisits.day, set: { visits: sql`${siteVisits.visits} + 1` } })
  return true
}

function daysAgo(days: number): string {
  return parisDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
}

async function visitsSince(day: string | null): Promise<number> {
  const [row] = await db
    .select({ value: sum(siteVisits.visits) })
    .from(siteVisits)
    .where(day ? gte(siteVisits.day, day) : undefined)
  return Number(row?.value ?? 0)
}

export type VisitStats = { today: number; last7Days: number; last30Days: number; total: number }

export async function getVisitStats(): Promise<VisitStats> {
  const [today, last7Days, last30Days, total] = await Promise.all([
    visitsSince(parisDay()),
    visitsSince(daysAgo(6)),
    visitsSince(daysAgo(29)),
    visitsSince(null),
  ])
  return { today, last7Days, last30Days, total }
}
