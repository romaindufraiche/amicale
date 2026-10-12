import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ReorderButtons } from '@/components/ui/reorder-buttons'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { OFFER_CATEGORY_LABELS } from '@/features/offers/labels'
import { movePartnerAction } from '@/features/partners/actions'
import { listPartnersForAdmin } from '@/features/partners/queries'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Partenaires' }

type Props = { searchParams: Promise<{ supprime?: string }> }

export default async function AdminPartnersPage({ searchParams }: Props) {
  await requirePermission('partners:manage', '/admin/partenaires')
  const deleted = (await searchParams).supprime === '1'
  const partners = await listPartnersForAdmin()
  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Partenaires"
        lead="Les flèches règlent l’ordre d’affichage sur la page « Partenaires » du site."
        actions={
          <ButtonLink href="/admin/partenaires/nouveau">
            <Plus aria-hidden className="size-4" /> Nouveau partenaire
          </ButtonLink>
        }
      />
      {deleted ? <Alert tone="success" title="Partenaire supprimé." /> : null}
      {partners.length === 0 ? (
        <EmptyState
          title="Aucun partenaire"
          action={<ButtonLink href="/admin/partenaires/nouveau">Ajouter un partenaire</ButtonLink>}
        >
          Présentez ici les réductions négociées par l’Amicale.
        </EmptyState>
      ) : (
        <Table caption="Liste des partenaires">
          <thead>
            <tr>
              <Th>
                <span className="sr-only">Ordre</span>
              </Th>
              <Th>Partenaire</Th>
              <Th>Catégorie</Th>
              <Th>Avantage</Th>
              <Th>Visibilité</Th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner, index) => (
              <tr key={partner.id}>
                <Td className="w-0">
                  <ReorderButtons
                    action={movePartnerAction}
                    id={partner.id}
                    label={partner.name}
                    isFirst={index === 0}
                    isLast={index === partners.length - 1}
                  />
                </Td>
                <Td>
                  <Link href={`/admin/partenaires/${partner.id}`} className="font-semibold link">
                    {partner.name}
                  </Link>
                </Td>
                <Td>{OFFER_CATEGORY_LABELS[partner.category]}</Td>
                <Td>{partner.advantage ?? '—'}</Td>
                <Td>
                  <Badge tone={partner.published ? 'success' : 'warning'}>
                    {partner.published ? 'Visible' : 'Masqué'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
