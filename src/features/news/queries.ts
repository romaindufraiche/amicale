import 'server-only'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { PAGE_SIZE } from '@/lib/pagination'
import { db } from '@/server/db/client'
import { news, type NewsVisibility } from '@/server/db/schema'

const listColumns = {
  id: news.id,
  slug: news.slug,
  title: news.title,
  excerpt: news.excerpt,
  visibility: news.visibility,
  imageId: news.imageId,
  publishedAt: news.publishedAt,
}

/** Actualités publiées ; les adhérents connectés voient aussi celles qui leur sont réservées. */
export async function listPublishedNews(options: {
  includeMembersOnly: boolean
  page?: number
  limit?: number
}) {
  const visibilities: NewsVisibility[] = options.includeMembersOnly ? ['PUBLIC', 'MEMBERS'] : ['PUBLIC']
  const where = and(eq(news.status, 'PUBLISHED'), inArray(news.visibility, visibilities))
  const limit = options.limit ?? PAGE_SIZE
  const page = options.page ?? 1
  const [rows, [total]] = await Promise.all([
    db
      .select(listColumns)
      .from(news)
      .where(where)
      .orderBy(desc(news.publishedAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(news).where(where),
  ])
  return { rows, total: total?.value ?? 0 }
}

export async function getPublishedNews(slug: string) {
  const [row] = await db
    .select()
    .from(news)
    .where(and(eq(news.slug, slug), eq(news.status, 'PUBLISHED')))
    .limit(1)
  return row ?? null
}

export async function listNewsForAdmin() {
  return db
    .select({ ...listColumns, status: news.status, updatedAt: news.updatedAt })
    .from(news)
    .orderBy(desc(news.updatedAt))
}

export async function getNewsForAdmin(id: string) {
  const [row] = await db.select().from(news).where(eq(news.id, id)).limit(1)
  return row ?? null
}

export async function listNewsForSitemap() {
  return db
    .select({ slug: news.slug, updatedAt: news.updatedAt })
    .from(news)
    .where(and(eq(news.status, 'PUBLISHED'), eq(news.visibility, 'PUBLIC')))
}
