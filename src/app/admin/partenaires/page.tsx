import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { OFFER_CATEGORY_LABELS } from '@/features/offers/labels'
import { listPartnersForAdmin } from '@/features/partners/queries'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Partenaires' }

export default async function AdminPartnersPage() {
  await requirePermission('partners:manage', '/admin/partenaires')
  const partners = await listPartnersForAdmin()
  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Partenaires"
        actions={
          <ButtonLink href="/admin/partenaires/nouveau">
            <Plus aria-hidden className="size-4" /> Nouveau partenaire
          </ButtonLink>
        }
      />
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
              <Th>Partenaire</Th>
              <Th>Catégorie</Th>
              <Th>Avantage</Th>
              <Th>Visibilité</Th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id}>
                <Td>
                  <Link href={`/admin/partenaires/${partner.id}`} className="font-semibold link">
                    {partner.name}
                  </Link>
                </Td>
                <Td>{OFFER_CATEGORY_LABELS[partner.category]}</Td>
                <Td>{partner.advantage}</Td>
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
