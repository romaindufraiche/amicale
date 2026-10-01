import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { cache } from 'react'
import { Alert } from '@/components/ui/alert'
import { OrderForm } from '@/features/orders/components/order-form'
import { OfferDetails } from '@/features/offers/components/offer-details'
import { getPublishedOfferBySlug, quantityOrderedBy } from '@/features/offers/queries'
import { AVAILABILITY_LABELS, offerAvailability } from '@/features/offers/rules'
import { parisDay } from '@/lib/dates'
import { isMembershipValid, requireActiveMember } from '@/server/auth/guards'

type Props = { params: Promise<{ slug: string }> }

const loadOffer = cache((slug: string) => getPublishedOfferBySlug(slug))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await loadOffer((await params).slug)
  return { title: offer?.title ?? 'Offre introuvable' }
}

export default async function OfferPage({ params }: Props) {
  const { slug } = await params
  const user = await requireActiveMember(`/espace/billetterie/${slug}`)
  const offer = await loadOffer(slug)
  if (!offer) notFound()

  const now = new Date()
  const availability = offerAvailability(offer, offer.tariffs, now, parisDay(now))
  const alreadyOrdered = await quantityOrderedBy(user.id, offer.id)
  const remainingAllowance =
    offer.maxPerMember === null ? null : Math.max(0, offer.maxPerMember - alreadyOrdered)
  const activeTariffs = offer.tariffs.filter((tariff) => tariff.active)
  const membershipValid = isMembershipValid(user)

  return (
    <>
      <Link href="/espace/billetterie" className="inline-flex items-center gap-2 self-start text-sm link">
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
          {alreadyOrdered > 0 ? (
            <Alert tone="info">
              Vous avez déjà commandé {alreadyOrdered} billet{alreadyOrdered > 1 ? 's' : ''} pour cette offre.{' '}
              <Link href="/espace/commandes">Voir mes commandes</Link>
            </Alert>
          ) : null}
          {offer.maxPerMember !== null ? (
            <p className="text-sm text-ink-muted">
              Limité à {offer.maxPerMember} billet{offer.maxPerMember > 1 ? 's' : ''} par adhérent.
            </p>
          ) : null}

          {!availability.open ? (
            <Alert tone="warning" title={AVAILABILITY_LABELS[availability.reason]} />
          ) : !membershipValid ? (
            <Alert tone="warning" title="Votre cotisation n’est plus à jour.">
              Contactez le bureau pour renouveler votre adhésion et accéder aux commandes.
            </Alert>
          ) : remainingAllowance === 0 ? (
            <Alert tone="info" title="Vous avez atteint la limite de billets pour cette offre." />
          ) : (
            <OrderForm
              offerId={offer.id}
              idempotencyKey={randomUUID()}
              remainingAllowance={remainingAllowance}
              tariffs={activeTariffs.map(({ id, label, memberPriceCents, publicPriceCents, stock }) => ({
                id,
                label,
                memberPriceCents,
                publicPriceCents,
                stock,
              }))}
            />
          )}
        </aside>
      </div>
    </>
  )
}
