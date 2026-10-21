import { Download } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/ui/action-form'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import {
  deleteRequestAction,
  setRequestPaidAction,
  setRequestProcessedAction,
} from '@/features/requests/actions'
import {
  countUnprocessedRequests,
  listOffersWithRequests,
  listRequestsForAdmin,
} from '@/features/requests/queries'
import { formatRequestLines, requestTotalCents } from '@/features/requests/service'
import { formatPrice } from '@/lib/money'
import {
  parseRequestFilters,
  REQUEST_FILTER_LABELS,
  REQUEST_FILTERS,
  requestFiltersQuery,
} from '@/features/requests/schemas'
import { cn } from '@/lib/cn'
import { formatDateTime, formatShortDate } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Commandes' }

function formatTotal(lines: Parameters<typeof requestTotalCents>[0]): string {
  const total = requestTotalCents(lines)
  return total === null ? '—' : formatPrice(total)
}

type Props = { searchParams: Promise<Record<string, string | undefined>> }

export default async function RequestsPage({ searchParams }: Props) {
  await requirePermission('requests:manage', '/admin/demandes')
  const filters = parseRequestFilters(await searchParams)
  const [requests, offers, unprocessed] = await Promise.all([
    listRequestsForAdmin(filters),
    listOffersWithRequests(),
    countUnprocessedRequests(),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Commandes"
        lead="Commandes passées depuis la fiche des offres. Chaque nouvelle commande vous est aussi envoyée par email. Marquez une commande comme traitée une fois prise en charge, et comme réglée une fois le règlement reçu."
        actions={
          <a
            href={`/admin/demandes/export${requestFiltersQuery(filters)}`}
            className={buttonClasses('secondary', 'sm')}
          >
            <Download aria-hidden className="size-4" /> Exporter (CSV)
          </a>
        }
      />

      <form method="get" action="/admin/demandes" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtre-statut" className="text-sm font-semibold">
            Statut
          </label>
          <select
            id="filtre-statut"
            name="statut"
            defaultValue={filters.status}
            className="h-11 rounded-sm border border-line-strong bg-surface px-3 hover:border-ink focus-visible:border-blue-500"
          >
            {REQUEST_FILTERS.map((value) => (
              <option key={value} value={value}>
                {REQUEST_FILTER_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:min-w-64">
          <label htmlFor="filtre-offre" className="text-sm font-semibold">
            Offre
          </label>
          <select
            id="filtre-offre"
            name="offre"
            defaultValue={filters.offerId ?? ''}
            className="h-11 rounded-sm border border-line-strong bg-surface px-3 hover:border-ink focus-visible:border-blue-500"
          >
            <option value="">Toutes les offres</option>
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.title}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonClasses('primary', 'sm', 'min-h-11')}>
          Filtrer
        </button>
      </form>

      <p className="font-semibold" role="status">
        {unprocessed === 0
          ? 'Toutes les commandes sont traitées.'
          : `${unprocessed} commande${unprocessed > 1 ? 's' : ''} à traiter.`}{' '}
        {unprocessed > 0 && filters.status !== 'a-traiter' ? (
          <Link href="/admin/demandes?statut=a-traiter" className="link">
            Afficher seulement celles-ci
          </Link>
        ) : null}
      </p>

      {requests.length === 0 ? (
        <EmptyState title="Aucune commande">
          Les commandes apparaissent ici dès qu’une personne remplit le formulaire « Commander » d’une offre.
        </EmptyState>
      ) : (
        <Table caption="Commandes">
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Personne</Th>
              <Th>Offre et billets</Th>
              <Th className="text-right">Total</Th>
              <Th>Suivi</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className={cn('align-top', !request.processedAt && 'bg-warning-50/60')}>
                <Td className="whitespace-nowrap tabular">{formatDateTime(request.createdAt)}</Td>
                <Td>
                  <p className="font-semibold">
                    {request.lastName} {request.firstName}
                  </p>
                  <p>
                    <a href={`mailto:${request.email}`} className="break-all link">
                      {request.email}
                    </a>
                  </p>
                </Td>
                <Td>
                  <Link href={`/admin/offres/${request.offerId}`} className="link">
                    {request.offerTitle}
                  </Link>
                  <p className="text-ink-muted">
                    {request.lines.length > 0
                      ? formatRequestLines(request.lines)
                      : `${request.quantity} billet${request.quantity > 1 ? 's' : ''}`}
                  </p>
                </Td>
                <Td className="text-right font-semibold whitespace-nowrap tabular">
                  {formatTotal(request.lines)}
                </Td>
                <Td>
                  <div className="flex flex-col items-start gap-1.5">
                    {request.processedAt ? (
                      <Badge tone="success">Traitée le {formatShortDate(request.processedAt)}</Badge>
                    ) : (
                      <Badge tone="danger">À traiter</Badge>
                    )}
                    {request.paidAt ? (
                      <Badge tone="success">Réglée le {formatShortDate(request.paidAt)}</Badge>
                    ) : (
                      <Badge tone="warning">Non réglée</Badge>
                    )}
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-col gap-2">
                    {request.processedAt ? (
                      <ActionForm
                        action={setRequestProcessedAction}
                        fields={{ requestId: request.id, processed: '0' }}
                        label="Repasser en non traitée"
                        variant="ghost"
                      />
                    ) : (
                      <ActionForm
                        action={setRequestProcessedAction}
                        fields={{ requestId: request.id, processed: '1' }}
                        label="Marquer comme traitée"
                        variant="primary"
                      />
                    )}
                    {request.paidAt ? (
                      <ActionForm
                        action={setRequestPaidAction}
                        fields={{ requestId: request.id, paid: '0' }}
                        label="Repasser en non réglée"
                        variant="ghost"
                      />
                    ) : (
                      <ActionForm
                        action={setRequestPaidAction}
                        fields={{ requestId: request.id, paid: '1' }}
                        label="Marquer comme réglée"
                      />
                    )}
                    <ActionForm
                      action={deleteRequestAction}
                      fields={{ requestId: request.id }}
                      label="Supprimer"
                      variant="danger"
                      confirm={`Supprimer la commande de ${request.firstName} ${request.lastName} ?`}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
