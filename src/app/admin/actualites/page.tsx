import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { PUBLICATION_STATUS_LABELS } from '@/features/offers/labels'
import { listNewsForAdmin } from '@/features/news/queries'
import { formatShortDate } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'
import type { PublicationStatus } from '@/server/db/schema'

export const metadata: Metadata = { title: 'Actualités' }

const STATUS_TONE: Record<PublicationStatus, BadgeTone> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
}

export default async function AdminNewsPage() {
  await requirePermission('news:manage', '/admin/actualites')
  const items = await listNewsForAdmin()
  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Actualités"
        actions={
          <ButtonLink href="/admin/actualites/nouvelle">
            <Plus aria-hidden className="size-4" /> Nouvelle actualité
          </ButtonLink>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          title="Aucune actualité"
          action={<ButtonLink href="/admin/actualites/nouvelle">Rédiger la première</ButtonLink>}
        >
          Les actualités publiques apparaissent sur la page d’accueil et dans la rubrique Actualités.
        </EmptyState>
      ) : (
        <Table caption="Liste des actualités">
          <thead>
            <tr>
              <Th>Titre</Th>
              <Th>Visibilité</Th>
              <Th>Statut</Th>
              <Th>Publication</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <Td>
                  <Link href={`/admin/actualites/${item.id}`} className="font-semibold link">
                    {item.title}
                  </Link>
                </Td>
                <Td>{item.visibility === 'PUBLIC' ? 'Public' : 'Adhérents'}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[item.status]}>{PUBLICATION_STATUS_LABELS[item.status]}</Badge>
                </Td>
                <Td className="tabular">{item.publishedAt ? formatShortDate(item.publishedAt) : '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
