import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { CATEGORY_ICONS } from '@/features/offers/components/offer-visual'
import {
  OFFER_CATEGORIES,
  OFFER_CATEGORY_LABELS,
  OFFER_KIND_LABELS,
  PUBLICATION_STATUS_LABELS,
} from '@/features/offers/labels'
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
        lead="Billetterie et sorties proposées aux adhérents, rangées par catégorie."
        actions={
          <ButtonLink href="/admin/offres/nouvelle">
            <Plus aria-hidden className="size-4" /> Nouvelle offre
          </ButtonLink>
        }
      />

      <nav aria-label="Aller à une catégorie" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {OFFER_CATEGORIES.map((category) => (
          <a key={category} href={`#categorie-${category}`} className="link">
            {OFFER_CATEGORY_LABELS[category]} ({offers.filter((offer) => offer.category === category).length})
          </a>
        ))}
      </nav>

      {OFFER_CATEGORIES.map((category) => {
        const items = offers.filter((offer) => offer.category === category)
        const Icon = CATEGORY_ICONS[category]
        const headingId = `categorie-${category}`
        return (
          <section key={category} aria-labelledby={headingId} className="flex scroll-mt-6 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3">
              <h2 id={headingId} className="flex items-center gap-3 text-h3">
                <Icon aria-hidden className="size-6 text-blue-500" />
                {OFFER_CATEGORY_LABELS[category]}
                <span className="font-sans text-base font-normal text-ink-muted">
                  {items.length} offre{items.length > 1 ? 's' : ''}
                </span>
              </h2>
              <ButtonLink href={`/admin/offres/nouvelle?categorie=${category}`} variant="secondary" size="sm">
                <Plus aria-hidden className="size-4" /> Ajouter une offre
                <span className="sr-only"> dans la catégorie {OFFER_CATEGORY_LABELS[category]}</span>
              </ButtonLink>
            </div>
            {items.length === 0 ? (
              <p className="text-ink-muted">Aucune offre dans cette catégorie.</p>
            ) : (
              <Table caption={`Offres de la catégorie ${OFFER_CATEGORY_LABELS[category]}`}>
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
                  {items.map((offer) => (
                    <tr key={offer.id}>
                      <Td>
                        <Link href={`/admin/offres/${offer.id}`} className="font-semibold link">
                          {offer.title}
                        </Link>
                        {offer.featured ? (
                          <Badge tone="highlight" className="ml-2">
                            À la une
                          </Badge>
                        ) : null}
                        {!offer.pricesPublic ? (
                          <Badge tone="neutral" className="ml-2">
                            Tarifs masqués aux visiteurs
                          </Badge>
                        ) : null}
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
                        <Badge tone={STATUS_TONE[offer.status]}>
                          {PUBLICATION_STATUS_LABELS[offer.status]}
                        </Badge>
                      </Td>
                      <Td className="tabular">{formatShortDate(offer.updatedAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </section>
        )
      })}
    </>
  )
}
