import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Alert } from '@/components/ui/alert'
import { buttonClasses } from '@/components/ui/button'
import { getDocumentInfo } from '@/features/media/service'
import { OfferDetails } from '@/features/offers/components/offer-details'
import { getPublishedOfferBySlug } from '@/features/offers/queries'
import { AVAILABILITY_LABELS, offerAvailability } from '@/features/offers/rules'
import { parisDay } from '@/lib/dates'
import { formatEuros, formatPrice } from '@/lib/money'
import { type OrderableTariff, OfferRequestForm } from '@/features/requests/components/offer-request-form'

type Props = { params: Promise<{ slug: string }> }

const loadOffer = cache((slug: string) => getPublishedOfferBySlug(slug))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const offer = await loadOffer(slug)
  if (!offer) return { title: 'Offre introuvable' }
  return {
    title: offer.title,
    description: offer.summary ?? undefined,
    alternates: { canonical: `/offres/${slug}` },
  }
}

/** Fiche d'une offre : tarifs (si le bureau les affiche) et, si l'offre le permet, commande. */
export default async function PublicOfferPage({ params }: Props) {
  const offer = await loadOffer((await params).slug)
  if (!offer) notFound()
  const now = new Date()
  const availability = offerAvailability(offer, offer.tariffs, now, parisDay(now))
  const attachment = await getDocumentInfo(offer.attachmentId)
  // Tarifs masqués par le bureau : ni affichés ni transmis au navigateur.
  const activeTariffs = offer.tariffs.filter((tariff) => tariff.active)
  const shownTariffs = offer.pricesPublic ? activeTariffs : []
  const orderableTariffs: OrderableTariff[] = activeTariffs.map((tariff) => ({
    id: tariff.id,
    label: tariff.label,
    stock: tariff.stock,
  }))

  return (
    <div className="mx-auto flex max-w-page flex-col gap-8 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <Link href="/offres" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Toutes les offres
      </Link>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:items-start">
        <OfferDetails offer={offer} attachment={attachment} />

        <aside
          aria-labelledby="commander"
          className="flex flex-col gap-5 rounded-md bg-surface p-6 shadow-raised lg:sticky lg:top-6"
        >
          <h2 id="commander" className="text-h3">
            {offer.orderable ? 'Commander' : 'Tarifs'}
          </h2>
          {shownTariffs.length > 0 ? (
            <ul className="flex flex-col divide-y divide-line">
              {shownTariffs.map((tariff) => (
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
          ) : null}
          {!offer.orderable ? (
            offer.providerUrl ? (
              <a
                href={offer.providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses('primary', 'md')}
              >
                Voir l’offre chez le prestataire <ExternalLink aria-hidden className="size-4" />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            ) : (
              <p className="text-ink-muted">Cette offre se réserve directement auprès du prestataire.</p>
            )
          ) : availability.open ? (
            <OfferRequestForm offerId={offer.id} tariffs={orderableTariffs} />
          ) : (
            <Alert tone="warning" title={AVAILABILITY_LABELS[availability.reason]} />
          )}
        </aside>
      </div>
    </div>
  )
}
