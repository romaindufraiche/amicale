import 'server-only'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { type ClassifiedKind, classifiedInterests, classifieds } from '@/server/db/schema'
import { purgeExpiredClassifieds } from './service'

/** Annonces publiées, épinglées d'abord puis les plus récentes ; filtrées par type si demandé. */
export async function listPublishedClassifieds(kind: ClassifiedKind | null) {
  await purgeExpiredClassifieds()
  return db
    .select()
    .from(classifieds)
    .where(and(eq(classifieds.published, true), kind ? eq(classifieds.kind, kind) : undefined))
    .orderBy(desc(classifieds.pinned), desc(classifieds.createdAt))
    .limit(200)
}

export async function getPublishedClassified(id: string) {
  await purgeExpiredClassifieds()
  const [row] = await db
    .select()
    .from(classifieds)
    .where(and(eq(classifieds.id, id), eq(classifieds.published, true)))
    .limit(1)
  return row ?? null
}

/** Annonces de l'espace bureau, avec le nombre de personnes intéressées (et à traiter). */
export async function listClassifiedsForAdmin() {
  await purgeExpiredClassifieds()
  const rows = await db
    .select()
    .from(classifieds)
    .orderBy(desc(classifieds.pinned), desc(classifieds.createdAt))
  const counts = await db
    .select({
      classifiedId: classifiedInterests.classifiedId,
      total: count(),
    })
    .from(classifiedInterests)
    .groupBy(classifiedInterests.classifiedId)
  const pendingCounts = await db
    .select({ classifiedId: classifiedInterests.classifiedId, pending: count() })
    .from(classifiedInterests)
    .where(isNull(classifiedInterests.processedAt))
    .groupBy(classifiedInterests.classifiedId)
  return rows.map((row) => ({
    ...row,
    interests: counts.find((entry) => entry.classifiedId === row.id)?.total ?? 0,
    pendingInterests: pendingCounts.find((entry) => entry.classifiedId === row.id)?.pending ?? 0,
  }))
}

export async function getClassifiedForAdmin(id: string) {
  const [row] = await db.select().from(classifieds).where(eq(classifieds.id, id)).limit(1)
  return row ?? null
}

export async function listInterestsForClassified(classifiedId: string) {
  return db
    .select()
    .from(classifiedInterests)
    .where(eq(classifiedInterests.classifiedId, classifiedId))
    .orderBy(desc(classifiedInterests.createdAt))
}

/** Nombre de personnes intéressées dont la demande n'est pas encore traitée (toutes annonces). */
export async function countPendingInterests(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(classifiedInterests)
    .where(isNull(classifiedInterests.processedAt))
  return row?.value ?? 0
}
