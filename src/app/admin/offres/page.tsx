import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { OFFER_CATEGORY_LABELS, OFFER_KIND_LABELS, PUBLICATION_STATUS_LABELS } from '@/features/offers/labels'
import { listOffersForAdmin } from '@/features/offers/queries'
import { formatDateTime, formatShortDate } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'
import type { PublicationStatus } from '@/server/db/schema'

export const metadata: Metadata = { title: 'Offres' }

const STATUS_TONE: Record<PublicationStatus, BadgeTone> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
}

export default async function AdminOffersPage() {
  await requirePermission('offers:manage', '/admin/offres')
  const offers = await listOffersForAdmin()

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Offres"
        lead="Billetterie et sorties proposées aux adhérents."
        actions={
          <ButtonLink href="/admin/offres/nouvelle">
            <Plus aria-hidden className="size-4" /> Nouvelle offre
          </ButtonLink>
        }
      />
      {offers.length === 0 ? (
        <EmptyState
          title="Aucune offre"
          action={<ButtonLink href="/admin/offres/nouvelle">Créer la première offre</ButtonLink>}
        >
          Créez une offre de billetterie ou une sortie, puis mettez-la en ligne pour la rendre visible des
          adhérents.
        </EmptyState>
      ) : (
        <Table caption="Liste des offres">
          <thead>
            <tr>
              <Th>Offre</Th>
              <Th>Type</Th>
              <Th>Date / clôture</Th>
              <Th className="text-right">Commandes</Th>
              <Th>Statut</Th>
              <Th>Modifiée le</Th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <Td>
                  <Link href={`/admin/offres/${offer.id}`} className="font-semibold link">
                    {offer.title}
                  </Link>
                  <span className="block text-ink-muted">{OFFER_CATEGORY_LABELS[offer.category]}</span>
                </Td>
                <Td>{OFFER_KIND_LABELS[offer.kind]}</Td>
                <Td className="tabular">
                  {offer.eventStartsAt ? formatDateTime(offer.eventStartsAt) : '—'}
                  {offer.orderDeadline ? (
                    <span className="block text-ink-muted">
                      Clôture : {formatShortDate(offer.orderDeadline)}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-right tabular">
                  {offer.ordersCount > 0 ? (
                    <Link href={`/admin/commandes?offre=${offer.id}`} className="link">
                      {offer.ordersCount}
                    </Link>
                  ) : (
                    0
                  )}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[offer.status]}>{PUBLICATION_STATUS_LABELS[offer.status]}</Badge>
                </Td>
                <Td className="tabular">{formatShortDate(offer.updatedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
