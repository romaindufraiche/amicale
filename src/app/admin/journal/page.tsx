import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { AUDIT_ACTION_LABELS, auditEntityHref } from '@/features/audit/labels'
import { listRecentAuditLogs } from '@/features/audit/queries'
import { formatDateTime } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Journal' }

export default async function AuditPage() {
  await requirePermission('audit:read', '/admin/journal')
  const entries = await listRecentAuditLogs()
  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Journal des actions"
        lead="Les 150 dernières actions réalisées par le bureau."
      />
      {entries.length === 0 ? (
        <EmptyState title="Aucune action enregistrée" />
      ) : (
        <Table caption="Journal des actions du bureau">
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Auteur</Th>
              <Th>Action</Th>
              <Th>Détails</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const href = auditEntityHref(entry.entityType, entry.entityId)
              const label = AUDIT_ACTION_LABELS[entry.action] ?? entry.action
              return (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap tabular">{formatDateTime(entry.createdAt)}</Td>
                  <Td>
                    {entry.actorLastName
                      ? `${entry.actorFirstName} ${entry.actorLastName}`
                      : 'Compte supprimé'}
                  </Td>
                  <Td>
                    {href ? (
                      <Link href={href} className="link">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </Td>
                  <Td className="text-ink-muted">
                    {entry.details
                      ? Object.entries(entry.details)
                          .map(([key, value]) => `${key} : ${value}`)
                          .join(' · ')
                      : '—'}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </>
  )
}
