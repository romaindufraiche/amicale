import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Eyebrow, PageHeader } from '@/components/ui/page-header'
import { OfferTicket } from '@/features/offers/components/offer-ticket'
import { OFFER_CATEGORIES, OFFER_CATEGORY_LABELS } from '@/features/offers/labels'
import { listPublishedOffers, type OfferWithTariffs } from '@/features/offers/queries'
import { offerAvailability } from '@/features/offers/rules'
import { cn } from '@/lib/cn'
import { parisDay } from '@/lib/dates'
import { isMembershipValid, requireActiveMember } from '@/server/auth/guards'
import type { OfferCategory } from '@/server/db/schema'

export const metadata: Metadata = { title: 'Billetterie & sorties' }

type Props = { searchParams: Promise<{ categorie?: string }> }

function isCategory(value: unknown): value is OfferCategory {
  return typeof value === 'string' && (OFFER_CATEGORIES as string[]).includes(value)
}

function OfferSection({ id, title, offers }: { id: string; title: string; offers: OfferWithTariffs[] }) {
  const now = new Date()
  const today = parisDay(now)
  if (offers.length === 0) return null
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <Eyebrow>
        <span id={id}>{title}</span>
      </Eyebrow>
      <ul className="flex flex-col gap-5">
        {offers.map((offer) => (
          <li key={offer.id}>
            <OfferTicket offer={offer} availability={offerAvailability(offer, offer.tariffs, now, today)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function CatalogPage({ searchParams }: Props) {
  const user = await requireActiveMember('/espace/billetterie')
  const { categorie } = await searchParams
  const category = isCategory(categorie) ? categorie : undefined
  const offers = await listPublishedOffers(category)

  const events = offers.filter((offer) => offer.kind === 'EVENT')
  const tickets = offers.filter((offer) => offer.kind === 'TICKET')

  return (
    <>
      <PageHeader
        eyebrow="Réservé aux adhérents"
        title="Billetterie & sorties"
        lead="Les prix affichés sont les tarifs adhérents. Le total de votre commande est toujours recalculé et confirmé avant validation."
      />

      {!isMembershipValid(user) ? (
        <Alert tone="warning" title="Votre cotisation n’est plus à jour.">
          Vous pouvez consulter les offres, mais pas commander. Contactez le bureau pour renouveler votre
          adhésion.
        </Alert>
      ) : null}

      <nav aria-label="Filtrer par catégorie">
        <ul className="flex flex-wrap gap-2">
          {[undefined, ...OFFER_CATEGORIES].map((value) => {
            const active = value === category
            return (
              <li key={value ?? 'all'}>
                <Link
                  href={value ? `/espace/billetterie?categorie=${value}` : '/espace/billetterie'}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-10 items-center rounded-sm border px-3.5 text-sm font-semibold transition-colors',
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-line-strong bg-surface text-ink hover:border-ink',
                  )}
                >
                  {value ? OFFER_CATEGORY_LABELS[value] : 'Toutes'}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {offers.length === 0 ? (
        <EmptyState title={category ? 'Aucune offre dans cette catégorie' : 'Aucune offre en ce moment'}>
          {category ? (
            <Link href="/espace/billetterie" className="link">
              Voir toutes les offres
            </Link>
          ) : (
            'Les nouvelles offres de billetterie et les prochaines sorties seront publiées ici par le bureau.'
          )}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-12">
          <OfferSection id="sorties" title="Sorties organisées par l’Amicale" offers={events} />
          <OfferSection id="billets" title="Billetterie" offers={tickets} />
        </div>
      )}
    </>
  )
}
