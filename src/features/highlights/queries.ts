import 'server-only'
import { and, asc, desc, eq, gt, inArray, isNull, lte, or } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { highlights, type NewsVisibility } from '@/server/db/schema'

/** Posts affichés dans le bandeau : publiés et dans leur période d'affichage. */
export async function listActiveHighlights(options: { includeMembersOnly: boolean }) {
  const now = new Date()
  const visibilities: NewsVisibility[] = options.includeMembersOnly ? ['PUBLIC', 'MEMBERS'] : ['PUBLIC']
  return db
    .select({
      id: highlights.id,
      title: highlights.title,
      body: highlights.body,
      linkUrl: highlights.linkUrl,
      linkLabel: highlights.linkLabel,
      tone: highlights.tone,
    })
    .from(highlights)
    .where(
      and(
        eq(highlights.published, true),
        inArray(highlights.visibility, visibilities),
        or(isNull(highlights.startsAt), lte(highlights.startsAt, now)),
        or(isNull(highlights.endsAt), gt(highlights.endsAt, now)),
      ),
    )
    .orderBy(asc(highlights.position), desc(highlights.createdAt))
    .limit(12)
}

export type ActiveHighlight = Awaited<ReturnType<typeof listActiveHighlights>>[number]

export async function listHighlightsForAdmin() {
  return db.select().from(highlights).orderBy(asc(highlights.position), desc(highlights.createdAt))
}

export async function getHighlightForAdmin(id: string) {
  const [row] = await db.select().from(highlights).where(eq(highlights.id, id)).limit(1)
  return row ?? null
}
