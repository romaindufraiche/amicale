import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { OrderSummaryRow } from '@/features/orders/components/order-summary'
import { listOrdersForUser } from '@/features/orders/queries'
import { requireActiveMember } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Mes commandes' }

export default async function MyOrdersPage() {
  const user = await requireActiveMember('/espace/commandes')
  const orders = await listOrdersForUser(user.id)

  return (
    <>
      <PageHeader eyebrow="Suivi" title="Mes commandes" />
      {orders.length > 0 ? (
        <ul className="border-t border-line">
          {orders.map((order) => (
            <OrderSummaryRow key={order.id} order={order} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Aucune commande pour le moment"
          action={<ButtonLink href="/espace/billetterie">Découvrir les offres</ButtonLink>}
        >
          Vos commandes de billetterie et vos inscriptions aux sorties apparaîtront ici.
        </EmptyState>
      )}
    </>
  )
}
