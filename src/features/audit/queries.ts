import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { auditLogs, users } from '@/server/db/schema'

export async function listRecentAuditLogs(limit = 150) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      actorFirstName: users.firstName,
      actorLastName: users.lastName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
}
