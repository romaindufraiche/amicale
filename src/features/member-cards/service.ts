import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { db } from '@/server/db/client'
import { members } from '@/server/db/schema'
import { type MemberCardInput, nameKey } from './schemas'

/**
 * Carte d'un adhérent : un adhérent déjà connu (même nom et prénom, sans tenir compte des
 * majuscules ni des accents) garde son numéro et l'orthographe enregistrée, et passe à la
 * saison en cours ; sinon il est ajouté au listing avec un nouveau numéro.
 */
export async function issueMemberCard(actorId: string, input: MemberCardInput, season: string) {
  return db.transaction(async (tx) => {
    const key = nameKey(input)
    const [existing] = await tx.select().from(members).where(eq(members.nameKey, key)).limit(1)
    if (existing) {
      const [updated] = await tx
        .update(members)
        .set({ season })
        .where(eq(members.id, existing.id))
        .returning()
      await recordAudit(tx, {
        actorId,
        action: 'member.renewed',
        entityType: 'member',
        entityId: existing.id,
        details: { number: existing.number, season },
      })
      return { member: updated ?? existing, created: false }
    }
    const [created] = await tx
      .insert(members)
      .values({ ...input, nameKey: key, season, createdById: actorId })
      .returning()
    if (!created) throw new Error('Insertion d’adhérent sans retour')
    await recordAudit(tx, {
      actorId,
      action: 'member.created',
      entityType: 'member',
      entityId: created.id,
      details: { number: created.number, season },
    })
    return { member: created, created: true }
  })
}

export async function deleteMember(actorId: string, memberId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [deleted] = await tx.delete(members).where(eq(members.id, memberId)).returning()
    if (!deleted) return false
    await recordAudit(tx, {
      actorId,
      action: 'member.deleted',
      entityType: 'member',
      entityId: memberId,
      details: { number: deleted.number },
    })
    return true
  })
}

export async function listMembers() {
  return db.select().from(members).orderBy(desc(members.number))
}

export async function getMember(id: string) {
  const [row] = await db.select().from(members).where(eq(members.id, id)).limit(1)
  return row ?? null
}
