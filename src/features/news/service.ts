import 'server-only'
import { eq } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { db } from '@/server/db/client'
import { news, type PublicationStatus } from '@/server/db/schema'
import type { NewsInput } from './schemas'
import { isUniqueViolation } from '@/server/db/errors'

export type NewsSaveResult = { ok: true; newsId: string } | { ok: false; field?: string; message: string }

export async function saveNews(
  actorId: string,
  newsId: string | null,
  input: NewsInput,
): Promise<NewsSaveResult> {
  try {
    return await db.transaction(async (tx) => {
      if (newsId) {
        const updated = await tx.update(news).set(input).where(eq(news.id, newsId)).returning({ id: news.id })
        if (updated.length === 0) return { ok: false, message: 'Actualité introuvable.' }
        await recordAudit(tx, { actorId, action: 'news.updated', entityType: 'news', entityId: newsId })
        return { ok: true, newsId }
      }
      const [created] = await tx
        .insert(news)
        .values({ ...input, authorId: actorId })
        .returning({ id: news.id })
      if (!created) throw new Error('Insertion d’actualité sans retour')
      await recordAudit(tx, { actorId, action: 'news.created', entityType: 'news', entityId: created.id })
      return { ok: true, newsId: created.id }
    })
  } catch (error) {
    if (isUniqueViolation(error, 'news_slug_key'))
      return { ok: false, field: 'slug', message: 'Cette adresse de page est déjà utilisée.' }
    throw error
  }
}

export async function setNewsStatus(
  actorId: string,
  newsId: string,
  status: PublicationStatus,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ publishedAt: news.publishedAt })
      .from(news)
      .where(eq(news.id, newsId))
      .for('update')
    if (!current) return false
    await tx
      .update(news)
      .set({
        status,
        publishedAt: status === 'PUBLISHED' ? (current.publishedAt ?? new Date()) : current.publishedAt,
      })
      .where(eq(news.id, newsId))
    await recordAudit(tx, {
      actorId,
      action: 'news.status_changed',
      entityType: 'news',
      entityId: newsId,
      details: { status },
    })
    return true
  })
}
