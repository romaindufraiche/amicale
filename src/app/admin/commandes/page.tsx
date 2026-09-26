import { Download } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { Table, Td, Th } from '@/components/ui/table'
import { listOffersForAdmin } from '@/features/offers/queries'
import { OrderStatusActions } from '@/features/orders/components/order-status-actions'
import { adminOrderQuery, parseAdminOrderFilters } from '@/features/orders/filters'
import { ORDER_STATUS } from '@/features/orders/labels'
import { listOrdersForAdmin } from '@/features/orders/queries'
import { allowedTransitions, formatOrderReference } from '@/features/orders/rules'
import { ORDER_STATUSES } from '@/features/orders/schemas'
import { formatShortDate } from '@/lib/dates'
import { formatEuros } from '@/lib/money'
import { pageCount, parsePage } from '@/lib/pagination'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Commandes' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const STATUS_OPTIONS = ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS[value].label }))

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requirePermission('orders:manage', '/admin/commandes')
  const params = await searchParams
  const filters = parseAdminOrderFilters(params)
  const page = parsePage(params.page)
  const [{ rows, total }, offers] = await Promise.all([
    listOrdersForAdmin(filters, page),
    listOffersForAdmin(),
  ])
  const selectedOffer = offers.find((offer) => offer.id === filters.offerId)

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Commandes"
        lead={`${total} commande${total > 1 ? 's' : ''}${selectedOffer ? ` · ${selectedOffer.title}` : ''}`}
        actions={
          <a
            href={`/admin/commandes/export${adminOrderQuery(filters)}`}
            className={buttonClasses('secondary', 'sm')}
            download
          >
            <Download aria-hidden className="size-4" /> Exporter (CSV)
          </a>
        }
      />
      <FilterBar
        action="/admin/commandes"
        search={{
          name: 'q',
          label: 'Rechercher (référence, nom, email, n° d’adhérent)',
          value: filters.search,
        }}
        select={{ name: 'statut', label: 'Statut', value: filters.status, options: STATUS_OPTIONS }}
        hasFilters={Boolean(filters.search || filters.status || filters.offerId)}
      />
      {offers.length > 0 ? (
        <nav aria-label="Filtrer par offre" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="label-caps text-ink-muted">Offre :</span>
          <Link
            href={`/admin/commandes${adminOrderQuery({ ...filters, offerId: undefined })}`}
            className="link"
            aria-current={!filters.offerId ? 'page' : undefined}
          >
            Toutes
          </Link>
          {offers
            .filter((offer) => offer.ordersCount > 0)
            .map((offer) => (
              <Link
                key={offer.id}
                href={`/admin/commandes${adminOrderQuery({ ...filters, offerId: offer.id })}`}
                aria-current={filters.offerId === offer.id ? 'page' : undefined}
                className="link aria-[current=page]:font-bold"
              >
                {offer.title}
              </Link>
            ))}
        </nav>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="Aucune commande ne correspond">
          Les commandes des adhérents apparaîtront ici dès qu’une offre sera en ligne.
        </EmptyState>
      ) : (
        <>
          <Table caption="Liste des commandes">
            <thead>
              <tr>
                <Th>Référence</Th>
                <Th>Adhérent</Th>
                <Th>Offre et billets</Th>
                <Th className="text-right">Montant</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id}>
                  <Td className="tabular">
                    <span className="font-semibold">{formatOrderReference(order.number)}</span>
                    <span className="block text-ink-muted">{formatShortDate(order.createdAt)}</span>
                  </Td>
                  <Td>
                    <span className="font-semibold">
                      {order.memberLastName.toUpperCase()} {order.memberFirstName}
                    </span>
                    <span className="block text-ink-muted tabular">
                      {order.memberNumber ?? order.memberEmail}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-semibold">{order.offerTitle}</span>
                    <ul className="text-ink-muted">
                      {order.lines.map((line, index) => (
                        <li key={index}>
                          {line.quantity} × {line.label}
                        </li>
                      ))}
                    </ul>
                  </Td>
                  <Td className="text-right font-semibold tabular">{formatEuros(order.totalCents)}</Td>
                  <Td>
                    <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
                  </Td>
                  <Td>
                    <OrderStatusActions
                      orderId={order.id}
                      reference={formatOrderReference(order.number)}
                      transitions={allowedTransitions(order.status)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={page}
            pageCount={pageCount(total)}
            hrefFor={(target) => `/admin/commandes${adminOrderQuery(filters, { page: String(target) })}`}
          />
        </>
      )}
    </>
  )
}
