import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { countPendingMessages } from '@/features/contact/service'
import { countMembersByStatus } from '@/features/members/service'
import { countOrdersByStatus } from '@/features/orders/stats'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Vue d’ensemble' }

type Tile = { value: number; label: string; href: string; action: string; urgent: boolean }

/** Accord en français : 0 et 1 au singulier. */
function plural(count: number, singular: string, pluralForm: string) {
  return count > 1 ? pluralForm : singular
}

export default async function AdminHomePage() {
  const user = await requirePermission('admin:access', '/admin')
  const [members, orders, messages] = await Promise.all([
    countMembersByStatus(),
    countOrdersByStatus(),
    countPendingMessages(),
  ])

  const todo: Tile[] = [
    {
      value: members.PENDING_APPROVAL,
      label: plural(
        members.PENDING_APPROVAL,
        'demande d’adhésion à examiner',
        'demandes d’adhésion à examiner',
      ),
      href: '/admin/adherents?statut=PENDING_APPROVAL',
      action: 'Examiner',
      urgent: members.PENDING_APPROVAL > 0,
    },
    {
      value: orders.PENDING_PAYMENT,
      label: plural(
        orders.PENDING_PAYMENT,
        'commande en attente de règlement',
        'commandes en attente de règlement',
      ),
      href: '/admin/commandes?statut=PENDING_PAYMENT',
      action: 'Voir',
      urgent: false,
    },
    {
      value: orders.PAID,
      label: plural(
        orders.PAID,
        'commande réglée, billets à remettre',
        'commandes réglées, billets à remettre',
      ),
      href: '/admin/commandes?statut=PAID',
      action: 'Préparer',
      urgent: orders.PAID > 0,
    },
    {
      value: messages,
      label: plural(messages, 'message non traité', 'messages non traités'),
      href: '/admin/messages',
      action: 'Lire',
      urgent: messages > 0,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title={`Bonjour ${user.firstName}`}
        lead={`${members.ACTIVE} ${plural(members.ACTIVE, 'adhérent actif', 'adhérents actifs')}.`}
      />
      <section aria-labelledby="a-traiter" className="flex flex-col gap-5">
        <h2 id="a-traiter" className="text-h3">
          À traiter
        </h2>
        <ul className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {todo.map((tile) => (
            <li key={tile.href} className="bg-surface">
              <Link href={tile.href} className="group flex h-full flex-col gap-3 p-6 hover:bg-sunken">
                <span className="flex items-center justify-between">
                  <span className="font-display text-h1 font-black tabular">{tile.value}</span>
                  {tile.urgent ? (
                    <span className="rounded-sm bg-red-50 px-2 py-1 label-caps text-red-700">À faire</span>
                  ) : null}
                </span>
                <span className="text-ink-muted">{tile.label}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold group-hover:text-red-700">
                  {tile.action} <ArrowRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
