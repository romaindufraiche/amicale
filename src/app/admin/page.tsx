import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { countPendingMessages } from '@/features/contact/service'
import { countUnpaidRequests, countUnprocessedRequests } from '@/features/requests/queries'
import { getSiteSettings } from '@/features/settings/queries'
import { getVisitStats } from '@/features/visits/service'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Vue d’ensemble' }

type Tile = { value: number; label: string; href: string; action: string; urgent: boolean }

/** Accord en français : 0 et 1 au singulier. */
function plural(count: number, singular: string, pluralForm: string) {
  return count > 1 ? pluralForm : singular
}

export default async function AdminHomePage() {
  const user = await requirePermission('admin:access', '/admin')
  const [unprocessedRequests, unpaidRequests, messages, settings, visits] = await Promise.all([
    countUnprocessedRequests(),
    countUnpaidRequests(),
    countPendingMessages(),
    getSiteSettings(),
    getVisitStats(),
  ])

  const visitTiles = [
    { label: 'Aujourd’hui', value: visits.today },
    { label: '7 derniers jours', value: visits.last7Days },
    { label: '30 derniers jours', value: visits.last30Days },
    { label: 'Depuis l’ouverture du compteur', value: visits.total },
  ]

  const todo: Tile[] = [
    {
      value: unprocessedRequests,
      label: plural(unprocessedRequests, 'commande à traiter', 'commandes à traiter'),
      href: '/admin/demandes?statut=a-traiter',
      action: 'Traiter',
      urgent: unprocessedRequests > 0,
    },
    {
      value: unpaidRequests,
      label: plural(unpaidRequests, 'commande non réglée', 'commandes non réglées'),
      href: '/admin/demandes?statut=a-regler',
      action: 'Voir',
      urgent: false,
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
      {!settings.membershipOpen ? (
        <Alert tone="info" title="Les adhésions sont fermées.">
          Les boutons « Adhérer en ligne » sont masqués sur le site.{' '}
          <Link href="/admin/reglages">Modifier dans les réglages</Link>
        </Alert>
      ) : !settings.membershipUrl ? (
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

      <section aria-labelledby="frequentation" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 id="frequentation" className="text-h3">
            Fréquentation du site
          </h2>
          <p className="text-sm text-ink-muted">
            Nombre de visites du site public. Une même personne est comptée une fois par demi-heure ; les
            robots ne sont pas comptés.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
          {visitTiles.map((tile) => (
            <div key={tile.label} className="flex flex-col-reverse gap-2 bg-surface p-6">
              <dt className="text-ink-muted">{tile.label}</dt>
              <dd className="font-display text-h1 font-black tabular">
                {tile.value.toLocaleString('fr-FR')}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
