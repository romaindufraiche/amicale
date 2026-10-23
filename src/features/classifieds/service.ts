import 'server-only'
import { eq } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { db } from '@/server/db/client'
import { classifieds } from '@/server/db/schema'
import type { ClassifiedInput } from './schemas'

/** Crée ou met à jour une annonce. Retourne `null` si l'annonce à modifier n'existe pas. */
export async function saveClassified(
  actorId: string,
  classifiedId: string | null,
  input: ClassifiedInput,
): Promise<string | null> {
  return db.transaction(async (tx) => {
    if (classifiedId) {
      const updated = await tx
        .update(classifieds)
        .set(input)
        .where(eq(classifieds.id, classifiedId))
        .returning({ id: classifieds.id })
      if (updated.length === 0) return null
      await recordAudit(tx, {
        actorId,
        action: 'classified.updated',
        entityType: 'classified',
        entityId: classifiedId,
      })
      return classifiedId
    }
    const [created] = await tx.insert(classifieds).values(input).returning({ id: classifieds.id })
    if (!created) throw new Error('Insertion d’annonce sans retour')
    await recordAudit(tx, {
      actorId,
      action: 'classified.created',
      entityType: 'classified',
      entityId: created.id,
    })
    return created.id
  })
}

export async function deleteClassified(actorId: string, classifiedId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(classifieds)
      .where(eq(classifieds.id, classifiedId))
      .returning({ id: classifieds.id })
    if (deleted.length === 0) return false
    await recordAudit(tx, {
      actorId,
      action: 'classified.deleted',
      entityType: 'classified',
      entityId: classifiedId,
    })
    return true
  })
}
