import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/dates'
import { formatEuros } from '@/lib/money'
import { ORDER_STATUS } from '../labels'
import type { UserOrder } from '../queries'
import { formatOrderReference } from '../rules'

/** Ligne de commande dans les listes de l'espace adhérent. */
export function OrderSummaryRow({ order }: { order: UserOrder }) {
  const status = ORDER_STATUS[order.status]
  const quantity = order.lines.reduce((sum, line) => sum + line.quantity, 0)
  return (
    <li className="group relative grid gap-3 border-b border-line py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8">
      <div className="flex flex-col gap-1">
        <p className="label-caps text-ink-muted tabular">
          {formatOrderReference(order.number)} · {formatDate(order.createdAt)}
        </p>
        <p className="font-display text-lead font-extrabold">
          <Link
            href={`/espace/commandes/${order.id}`}
            className="group-hover:text-red-700 after:absolute after:inset-0"
          >
            {order.offerTitle}
          </Link>
        </p>
        <p className="text-sm text-ink-muted">
          {quantity} billet{quantity > 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
        <span className="font-display text-lead font-extrabold tabular">{formatEuros(order.totalCents)}</span>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
    </li>
  )
}
