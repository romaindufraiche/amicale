import { Download, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/ui/action-form'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { deleteRequestAction, setRequestPaidAction } from '@/features/requests/actions'
import { listOffersWithRequests, listRequestsForAdmin } from '@/features/requests/queries'
import {
  parseRequestFilters,
  REQUEST_FILTER_LABELS,
  REQUEST_FILTERS,
  requestFiltersQuery,
} from '@/features/requests/schemas'
import { formatDateTime } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Demandes' }

type Props = { searchParams: Promise<Record<string, string | undefined>> }

export default async function RequestsPage({ searchParams }: Props) {
  await requirePermission('requests:manage', '/admin/demandes')
  const filters = parseRequestFilters(await searchParams)
  const [requests, offers] = await Promise.all([listRequestsForAdmin(filters), listOffersWithRequests()])

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Demandes"
        lead="Personnes ayant laissé leurs coordonnées avant de payer une offre sur HelloAsso. Comparez avec les paiements reçus sur HelloAsso, puis notez ceux que vous avez constatés."
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
            Paiement
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

      {requests.length === 0 ? (
        <EmptyState title="Aucune demande">
          Les demandes apparaissent ici dès qu’une personne remplit le formulaire « Commander » d’une offre.
        </EmptyState>
      ) : (
        <Table caption="Demandes de commande">
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Personne</Th>
              <Th>Offre</Th>
              <Th>Paiement</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="align-top">
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
                  {request.phone ? (
                    <p>
                      <a href={`tel:${request.phone}`} className="link tabular">
                        {request.phone}
                      </a>
                    </p>
                  ) : null}
                </Td>
                <Td>
                  <Link href={`/admin/offres/${request.offerId}`} className="link">
                    {request.offerTitle}
                  </Link>
                  {request.offerHelloassoUrl ? (
                    <p>
                      <a
                        href={request.offerHelloassoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-caption link"
                      >
                        Page HelloAsso <ExternalLink aria-hidden className="size-3" />
                        <span className="sr-only">(nouvel onglet)</span>
                      </a>
                    </p>
                  ) : (
                    <p className="text-caption text-ink-muted">Pas de lien HelloAsso</p>
                  )}
                </Td>
                <Td>
                  {request.paidAt ? (
                    <Badge tone="success">Réglée le {formatDateTime(request.paidAt)}</Badge>
                  ) : (
                    <Badge tone="warning">Non constaté</Badge>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-col gap-2">
                    {request.paidAt ? (
                      <ActionForm
                        action={setRequestPaidAction}
                        fields={{ requestId: request.id, paid: '0' }}
                        label="Annuler le paiement"
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
                      confirm={`Supprimer la demande de ${request.firstName} ${request.lastName} ?`}
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
