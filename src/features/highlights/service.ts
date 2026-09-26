import 'server-only'
import { eq } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { db } from '@/server/db/client'
import { highlights } from '@/server/db/schema'
import type { HighlightInput } from './schemas'

/** Crée ou met à jour un post. Retourne `null` si le post à modifier n'existe pas. */
export async function saveHighlight(
  actorId: string,
  highlightId: string | null,
  input: HighlightInput,
): Promise<string | null> {
  return db.transaction(async (tx) => {
    if (highlightId) {
      const updated = await tx
        .update(highlights)
        .set(input)
        .where(eq(highlights.id, highlightId))
        .returning({ id: highlights.id })
      if (updated.length === 0) return null
      await recordAudit(tx, {
        actorId,
        action: 'highlight.updated',
        entityType: 'highlight',
        entityId: highlightId,
      })
      return highlightId
    }
    const [created] = await tx.insert(highlights).values(input).returning({ id: highlights.id })
    if (!created) throw new Error('Insertion de post sans retour')
    await recordAudit(tx, {
      actorId,
      action: 'highlight.created',
      entityType: 'highlight',
      entityId: created.id,
    })
    return created.id
  })
}

export async function deleteHighlight(actorId: string, highlightId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(highlights)
      .where(eq(highlights.id, highlightId))
      .returning({ id: highlights.id })
    if (deleted.length === 0) return false
    await recordAudit(tx, {
      actorId,
      action: 'highlight.deleted',
      entityType: 'highlight',
      entityId: highlightId,
    })
    return true
  })
}
