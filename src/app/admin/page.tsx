import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { countPendingMessages } from '@/features/contact/service'
import { countPublishedOffersWithoutPaymentLink } from '@/features/offers/queries'
import { countUnpaidRequests } from '@/features/requests/queries'
import { getSiteSettings } from '@/features/settings/queries'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Vue d’ensemble' }

type Tile = { value: number; label: string; href: string; action: string; urgent: boolean }

/** Accord en français : 0 et 1 au singulier. */
function plural(count: number, singular: string, pluralForm: string) {
  return count > 1 ? pluralForm : singular
}

export default async function AdminHomePage() {
  const user = await requirePermission('admin:access', '/admin')
  const [unpaidRequests, offersWithoutLink, messages, settings] = await Promise.all([
    countUnpaidRequests(),
    countPublishedOffersWithoutPaymentLink(),
    countPendingMessages(),
    getSiteSettings(),
  ])

  const todo: Tile[] = [
    {
      value: unpaidRequests,
      label: plural(
        unpaidRequests,
        'demande dont le paiement n’est pas constaté',
        'demandes dont le paiement n’est pas constaté',
      ),
      href: '/admin/demandes?statut=a-regler',
      action: 'Voir',
      urgent: false,
    },
    {
      value: offersWithoutLink,
      label: plural(
        offersWithoutLink,
        'offre en ligne sans lien HelloAsso',
        'offres en ligne sans lien HelloAsso',
      ),
      href: '/admin/offres',
      action: 'Compléter',
      urgent: offersWithoutLink > 0,
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
      <PageHeader eyebrow="Espace bureau" title={`Bonjour ${user.firstName}`} />
      {!settings.membershipUrl ? (
        <Alert tone="warning" title="Le lien HelloAsso d’adhésion n’est pas renseigné.">
          Les boutons « Adhérer » du site mènent pour l’instant à la page « Adhérer ».{' '}
          <Link href="/admin/reglages">Renseigner le lien</Link>
        </Alert>
      ) : null}
      <section aria-labelledby="a-traiter" className="flex flex-col gap-5">
        <h2 id="a-traiter" className="text-h3">
          À traiter
        </h2>
        <ul className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
          {todo.map((tile) => (
            <li key={tile.href} className="bg-surface">
              <Link href={tile.href} className="group flex h-full flex-col gap-3 p-6 hover:bg-sunken">
                <span className="flex items-center justify-between">
                  <span className="font-display text-h1 font-black tabular">{tile.value}</span>
                  {tile.urgent ? (
                    <span className="rounded-sm bg-rose-50 px-2 py-1 label-caps text-rose-700">À faire</span>
                  ) : null}
                </span>
                <span className="text-ink-muted">{tile.label}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold group-hover:text-blue-600">
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
