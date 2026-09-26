import 'server-only'
import { eq } from 'drizzle-orm'
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
    const [created] = await tx.insert(partners).values(input).returning({ id: partners.id })
    if (!created) throw new Error('Insertion de partenaire sans retour')
    await recordAudit(tx, { actorId, action: 'partner.created', entityType: 'partner', entityId: created.id })
    return created.id
  })
}
