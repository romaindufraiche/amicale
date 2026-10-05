import 'server-only'
import { recordAudit } from '@/features/audit/service'
import { db } from '@/server/db/client'
import { siteSettings } from '@/server/db/schema'
import type { SettingsInput } from './schemas'

export async function updateSiteSettings(actorId: string, input: SettingsInput): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(siteSettings)
      .values({ id: 1, ...input, updatedById: actorId })
      .onConflictDoUpdate({ target: siteSettings.id, set: { ...input, updatedById: actorId } })
    await recordAudit(tx, {
      actorId,
      action: 'settings.updated',
      entityType: 'site_settings',
      entityId: '1',
      details: { membershipUrl: input.membershipUrl },
    })
  })
}
