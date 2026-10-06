import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { OFFER_CATEGORY_LABELS } from '@/features/offers/labels'
import { listPublishedPartners } from '@/features/partners/queries'

export const metadata: Metadata = {
  title: 'Partenaires',
  description: 'Les avantages négociés par l’Amicale des Policiers du Val d’Oise auprès de ses partenaires.',
  alternates: { canonical: '/partenaires' },
}

export default async function PartnersPage() {
  const partners = await listPublishedPartners()

  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader
        eyebrow="Avantages"
        title="Nos partenaires"
        lead="Les conditions préférentielles négociées par l’Amicale auprès de ses partenaires."
      />
      {partners.length === 0 ? (
        <EmptyState title="Aucun partenaire pour le moment">
          Les partenaires de l’Amicale et leurs conditions préférentielles seront présentés ici.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {partners.map((partner) => (
            <li
              key={partner.id}
              className="flex flex-col gap-4 rounded-md border-t-4 border-blue-600 bg-surface p-6 shadow-raised"
            >
              <div className="flex flex-col gap-1">
                <p className="label-caps text-ink-muted">{OFFER_CATEGORY_LABELS[partner.category]}</p>
                <h2 className="text-h3">{partner.name}</h2>
              </div>
              <p className="font-display text-lead font-extrabold text-blue-700">{partner.advantage}</p>
              {partner.description ? (
                <p className="whitespace-pre-line text-ink-muted">{partner.description}</p>
              ) : null}
              <div className="mt-auto flex flex-col gap-1 rounded-sm bg-sunken p-4">
                <p className="label-caps text-ink-muted">Comment en profiter</p>
                <p className="break-words whitespace-pre-line">{partner.howToBenefit}</p>
              </div>
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
    </div>
  )
}
