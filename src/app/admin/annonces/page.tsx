import { Pin, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { CLASSIFIED_KINDS } from '@/features/classifieds/labels'
import { listClassifiedsForAdmin } from '@/features/classifieds/queries'
import { formatShortDate } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Annonces' }

type Props = { searchParams: Promise<{ supprime?: string }> }

export default async function AdminClassifiedsPage({ searchParams }: Props) {
  await requirePermission('classifieds:manage', '/admin/annonces')
  const items = await listClassifiedsForAdmin()
  const deleted = (await searchParams).supprime === '1'

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Annonces"
        lead="Petites annonces des collègues : vente, location, prêt, don ou troc. Elles sont visibles par tous dans la rubrique « Annonces » du site."
        actions={
          <ButtonLink href="/admin/annonces/nouveau">
            <Plus aria-hidden className="size-4" /> Nouvelle annonce
          </ButtonLink>
        }
      />
      {deleted ? <Alert tone="success" title="Annonce supprimée." /> : null}
      {items.length === 0 ? (
        <EmptyState
          title="Aucune annonce"
          action={<ButtonLink href="/admin/annonces/nouveau">Créer la première annonce</ButtonLink>}
        >
          Une maison à vendre, du matériel à prêter, des places à céder…
        </EmptyState>
      ) : (
        <Table caption="Annonces">
          <thead>
            <tr>
              <Th>Annonce</Th>
              <Th>Type</Th>
              <Th>Date</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <Td>
                  <span className="flex items-center gap-2">
                    {item.pinned ? (
                      <Pin aria-label="Épinglée" className="size-4 shrink-0 text-rose-600" />
                    ) : null}
                    <Link href={`/admin/annonces/${item.id}`} className="font-semibold link">
                      {item.title}
                    </Link>
                  </span>
                </Td>
                <Td>{CLASSIFIED_KINDS[item.kind].label}</Td>
                <Td className="tabular">{formatShortDate(item.createdAt)}</Td>
                <Td>
                  {item.published ? (
                    <Badge tone="success">En ligne</Badge>
                  ) : (
                    <Badge tone="warning">Brouillon</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
