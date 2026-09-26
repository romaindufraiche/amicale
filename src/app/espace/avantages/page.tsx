import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { OFFER_CATEGORY_LABELS } from '@/features/offers/labels'
import { listPublishedPartners } from '@/features/partners/queries'
import { isMembershipValid, requireActiveMember } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Avantages partenaires' }

export default async function PartnersPage() {
  const user = await requireActiveMember('/espace/avantages')
  const partners = await listPublishedPartners()
  const valid = isMembershipValid(user)

  return (
    <>
      <PageHeader
        eyebrow="Réservé aux adhérents"
        title="Avantages partenaires"
        lead="Les conditions négociées par l’Amicale auprès de ses partenaires. Merci de ne pas diffuser les codes en dehors de l’association."
      />
      {!valid ? (
        <Alert tone="warning" title="Votre cotisation n’est plus à jour.">
          Les modalités d’accès aux avantages sont masquées jusqu’au renouvellement de votre adhésion.
        </Alert>
      ) : null}
      {partners.length === 0 ? (
        <EmptyState title="Aucun avantage partenaire pour le moment">
          Les partenaires de l’Amicale et leurs conditions préférentielles seront présentés ici.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {partners.map((partner) => (
            <li
              key={partner.id}
              className="flex flex-col gap-4 rounded-md border-t-4 border-red-600 bg-surface p-6"
            >
              <div className="flex flex-col gap-1">
                <p className="label-caps text-ink-muted">{OFFER_CATEGORY_LABELS[partner.category]}</p>
                <h2 className="text-h3">{partner.name}</h2>
              </div>
              <p className="font-display text-lead font-extrabold text-red-700">{partner.advantage}</p>
              {partner.description ? (
                <p className="whitespace-pre-line text-ink-muted">{partner.description}</p>
              ) : null}
              {valid ? (
                <div className="mt-auto flex flex-col gap-1 rounded-sm bg-sunken p-4">
                  <p className="label-caps text-ink-muted">Comment en profiter</p>
                  <p className="break-words whitespace-pre-line">{partner.howToBenefit}</p>
                </div>
              ) : null}
              {partner.websiteUrl ? (
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 self-start text-sm font-semibold link"
                >
                  Site du partenaire <ExternalLink aria-hidden className="size-3.5" />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
