import 'server-only'
import { asc, desc, eq, gt, lt, sql } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { db } from '@/server/db/client'
import { partners } from '@/server/db/schema'
import type { PartnerInput } from './schemas'

/** Crée ou met à jour un partenaire. Retourne `null` si le partenaire à modifier n'existe pas. */
export async function savePartner(
  actorId: string,
  partnerId: string | null,
  input: PartnerInput,
): Promise<string | null> {
  return db.transaction(async (tx) => {
    if (partnerId) {
      const updated = await tx
        .update(partners)
        .set(input)
        .where(eq(partners.id, partnerId))
        .returning({ id: partners.id })
      if (updated.length === 0) return null
      await recordAudit(tx, {
        actorId,
        action: 'partner.updated',
        entityType: 'partner',
        entityId: partnerId,
      })
      return partnerId
    }
    // Un nouveau partenaire apparaît en tête ; le bureau le déplace ensuite s'il le souhaite.
    const [first] = await tx
      .select({ value: sql<number>`coalesce(min(${partners.position}), 1)` })
      .from(partners)
    const [created] = await tx
      .insert(partners)
      .values({ ...input, position: (first?.value ?? 1) - 1 })
      .returning({ id: partners.id })
    if (!created) throw new Error('Insertion de partenaire sans retour')
    await recordAudit(tx, { actorId, action: 'partner.created', entityType: 'partner', entityId: created.id })
    return created.id
  })
}

/** Monte ou descend un partenaire d'un cran (échange de position avec son voisin). */
export async function movePartner(
  actorId: string,
  partnerId: string,
  direction: 'up' | 'down',
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ id: partners.id, position: partners.position })
      .from(partners)
      .where(eq(partners.id, partnerId))
      .for('update')
    if (!current) return false
    const [neighbor] = await tx
      .select({ id: partners.id, position: partners.position })
      .from(partners)
      .where(
        direction === 'up'
          ? lt(partners.position, current.position)
          : gt(partners.position, current.position),
      )
      .orderBy(direction === 'up' ? desc(partners.position) : asc(partners.position))
      .limit(1)
      .for('update')
    if (!neighbor) return false
    await tx.update(partners).set({ position: neighbor.position }).where(eq(partners.id, current.id))
    await tx.update(partners).set({ position: current.position }).where(eq(partners.id, neighbor.id))
    await recordAudit(tx, { actorId, action: 'partner.moved', entityType: 'partner', entityId: partnerId })
    return true
  })
}

export async function deletePartner(actorId: string, partnerId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(partners)
      .where(eq(partners.id, partnerId))
      .returning({ id: partners.id, name: partners.name })
    if (!deleted) return false
    await recordAudit(tx, {
      actorId,
      action: 'partner.deleted',
      entityType: 'partner',
      entityId: partnerId,
      details: { name: deleted.name },
    })
    return true
  })
}
