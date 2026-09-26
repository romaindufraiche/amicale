import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { site } from '@/config/site'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, Td, Th } from '@/components/ui/table'
import { CancelOrderForm } from '@/features/orders/components/cancel-order-form'
import { ORDER_STATUS, PAYMENT_FALLBACK } from '@/features/orders/labels'
import { getOrderForUser } from '@/features/orders/queries'
import { formatOrderReference } from '@/features/orders/rules'
import { formatDateTime } from '@/lib/dates'
import { formatEuros } from '@/lib/money'
import { requireActiveMember } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Commande' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ confirmee?: string }> }

export default async function MyOrderPage({ params, searchParams }: Props) {
  const { id } = await params
  const user = await requireActiveMember(`/espace/commandes/${id}`)
  const orderId = z.uuid().safeParse(id)
  // Filtré sur l'adhérent connecté : la commande d'un autre renvoie une 404.
  const order = orderId.success ? await getOrderForUser(user.id, orderId.data) : null
  if (!order) notFound()

  const justCreated = (await searchParams).confirmee === '1'
  const status = ORDER_STATUS[order.status]
  const reference = formatOrderReference(order.number)

  return (
    <>
      <Link href="/espace/commandes" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Mes commandes
      </Link>

      {justCreated ? (
        <Alert tone="success" title={`Commande ${reference} enregistrée`}>
          Un email de confirmation vous a été envoyé.
        </Alert>
      ) : null}

      <header className="flex flex-col gap-3">
        <p className="label-caps text-ink-muted tabular">
          Commande {reference} · {formatDateTime(order.createdAt)}
        </p>
        <h1 className="text-h1">{order.offerTitle}</h1>
        <div className="flex items-center gap-3">
          <Badge tone={status.tone}>{status.label}</Badge>
          <p className="text-ink-muted">{status.description}</p>
        </div>
      </header>

      <Table caption={`Détail de la commande ${reference}`}>
        <thead>
          <tr>
            <Th>Tarif</Th>
            <Th className="text-right">Prix unitaire</Th>
            <Th className="text-right">Quantité</Th>
            <Th className="text-right">Montant</Th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line, index) => (
            <tr key={index}>
              <Td>{line.label}</Td>
              <Td className="text-right tabular">{formatEuros(line.unitPriceCents)}</Td>
              <Td className="text-right tabular">{line.quantity}</Td>
              <Td className="text-right tabular">{formatEuros(line.unitPriceCents * line.quantity)}</Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <Td colSpan={3} className="border-b-0 text-right font-semibold">
              Total
            </Td>
            <Td className="border-b-0 text-right font-display text-lead font-extrabold tabular">
              {formatEuros(order.totalCents)}
            </Td>
          </tr>
        </tfoot>
      </Table>

      <div className="grid gap-6 md:grid-cols-2">
        {order.status === 'PENDING_PAYMENT' ? (
          <section aria-labelledby="reglement" className="flex flex-col gap-3 rounded-md bg-surface p-6">
            <h2 id="reglement" className="text-h3">
              Règlement
            </h2>
            <p className="whitespace-pre-line">{site.paymentInstructions ?? PAYMENT_FALLBACK}</p>
            <p className="text-sm text-ink-muted">
              Rappelez la référence {reference} lors de votre règlement.
            </p>
          </section>
        ) : null}
        {order.pickupInfo && order.status !== 'CANCELLED' ? (
          <section aria-labelledby="retrait" className="flex flex-col gap-3 rounded-md bg-surface p-6">
            <h2 id="retrait" className="text-h3">
              Remise des billets
            </h2>
            <p className="whitespace-pre-line">{order.pickupInfo}</p>
          </section>
        ) : null}
      </div>

      {order.status === 'PENDING_PAYMENT' ? (
        <section aria-labelledby="annulation" className="flex flex-col gap-3 border-t border-line pt-8">
          <h2 id="annulation" className="text-h3">
            Changement de programme ?
          </h2>
          <p className="max-w-prose text-ink-muted">
            Tant qu’elle n’est pas réglée, vous pouvez annuler cette commande : les places sont immédiatement
            remises en vente.
          </p>
          <CancelOrderForm orderId={order.id} />
        </section>
      ) : null}
    </>
  )
}
