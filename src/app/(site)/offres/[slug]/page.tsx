import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Alert } from '@/components/ui/alert'
import { OfferDetails } from '@/features/offers/components/offer-details'
import { getPublishedOfferBySlug } from '@/features/offers/queries'
import { AVAILABILITY_LABELS, offerAvailability } from '@/features/offers/rules'
import { parisDay } from '@/lib/dates'
import { formatEuros, formatPrice } from '@/lib/money'
import { OfferRequestForm } from '@/features/requests/components/offer-request-form'

type Props = { params: Promise<{ slug: string }> }

const loadOffer = cache((slug: string) => getPublishedOfferBySlug(slug))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const offer = await loadOffer(slug)
  if (!offer) return { title: 'Offre introuvable' }
  return { title: offer.title, description: offer.summary, alternates: { canonical: `/offres/${slug}` } }
}

/** Fiche d'une offre : tarifs (si le bureau les affiche) et formulaire de commande. */
export default async function PublicOfferPage({ params }: Props) {
  const offer = await loadOffer((await params).slug)
  if (!offer) notFound()
  const now = new Date()
  const availability = offerAvailability(offer, offer.tariffs, now, parisDay(now))
  // Tarifs masqués par le bureau : ni affichés ni transmis au navigateur.
  const activeTariffs = offer.pricesPublic ? offer.tariffs.filter((tariff) => tariff.active) : []

  return (
    <div className="mx-auto flex max-w-page flex-col gap-8 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <Link href="/offres" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Toutes les offres
      </Link>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:items-start">
        <OfferDetails offer={offer} />

        <aside
          aria-labelledby="commander"
          className="flex flex-col gap-5 rounded-md bg-surface p-6 shadow-raised lg:sticky lg:top-6"
        >
          <h2 id="commander" className="text-h3">
            Commander
          </h2>
          {activeTariffs.length > 0 ? (
            <ul className="flex flex-col divide-y divide-line">
              {activeTariffs.map((tariff) => (
                <li key={tariff.id} className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
                  <span className="font-semibold">{tariff.label}</span>
                  <span className="flex items-baseline gap-2 text-right">
                    {tariff.publicPriceCents && tariff.publicPriceCents > tariff.memberPriceCents ? (
                      <span className="text-sm text-ink-muted">
                        <span className="sr-only">Prix public : </span>
                        <s className="tabular">{formatEuros(tariff.publicPriceCents)}</s>
                      </span>
                    ) : null}
                    <span className="font-display text-lead font-black tabular">
                      <span className="sr-only">Tarif adhérent : </span>
                      {formatPrice(tariff.memberPriceCents)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted">Les tarifs sont indiqués sur la page de paiement.</p>
          )}
          {availability.open ? (
            <>
              <p className="text-sm text-ink-muted">
                Indiquez vos coordonnées, puis réglez votre commande en ligne sur HelloAsso.
              </p>
              <OfferRequestForm offerId={offer.id} />
            </>
          ) : (
            <Alert tone="warning" title={AVAILABILITY_LABELS[availability.reason]} />
          )}
        </aside>
      </div>
    </div>
  )
}
