import 'server-only'
import { type db, type Transaction } from '@/server/db/client'
import { auditLogs } from '@/server/db/schema'

export type AuditEntry = {
  actorId: string | null
  action: string
  entityType:
    | 'user'
    | 'offer'
    | 'order'
    | 'offer_request'
    | 'news'
    | 'partner'
    | 'contact_message'
    | 'highlight'
    | 'site_settings'
  entityId: string
  details?: Record<string, string | number | boolean | null>
}

/** Trace une action du bureau. À appeler dans la même transaction que l'action tracée. */
export async function recordAudit(executor: Transaction | typeof db, entry: AuditEntry): Promise<void> {
  await executor.insert(auditLogs).values(entry)
}
