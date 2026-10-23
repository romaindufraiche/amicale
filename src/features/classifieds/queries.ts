import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { type ClassifiedKind, classifieds } from '@/server/db/schema'

/** Annonces publiées, épinglées d'abord puis les plus récentes ; filtrées par type si demandé. */
export async function listPublishedClassifieds(kind: ClassifiedKind | null) {
  return db
    .select()
    .from(classifieds)
    .where(and(eq(classifieds.published, true), kind ? eq(classifieds.kind, kind) : undefined))
    .orderBy(desc(classifieds.pinned), desc(classifieds.createdAt))
    .limit(200)
}

export async function getPublishedClassified(id: string) {
  const [row] = await db
    .select()
    .from(classifieds)
    .where(and(eq(classifieds.id, id), eq(classifieds.published, true)))
    .limit(1)
  return row ?? null
}

export async function listClassifiedsForAdmin() {
  return db.select().from(classifieds).orderBy(desc(classifieds.pinned), desc(classifieds.createdAt))
}

export async function getClassifiedForAdmin(id: string) {
  const [row] = await db.select().from(classifieds).where(eq(classifieds.id, id)).limit(1)
  return row ?? null
}
