import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { Alert } from '@/components/ui/alert'
import { ButtonLink } from '@/components/ui/button'
import { OfferDetails } from '@/features/offers/components/offer-details'
import { getPublishedOfferBySlug } from '@/features/offers/queries'
import { AVAILABILITY_LABELS, offerAvailability } from '@/features/offers/rules'
import { parisDay } from '@/lib/dates'
import { getCurrentSession } from '@/server/auth/session'

type Props = { params: Promise<{ slug: string }> }

const loadOffer = cache((slug: string) => getPublishedOfferBySlug(slug))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const offer = await loadOffer(slug)
  if (!offer) return { title: 'Offre introuvable' }
  return { title: offer.title, description: offer.summary, alternates: { canonical: `/offres/${slug}` } }
}

/** Fiche publique d'une offre : tout sauf les tarifs adhérents et le formulaire de commande. */
export default async function PublicOfferPage({ params }: Props) {
  const { slug } = await params
  const memberPath = `/espace/billetterie/${slug}`
  const session = await getCurrentSession()
  if (session?.user.status === 'ACTIVE') redirect(memberPath)

  const offer = await loadOffer(slug)
  if (!offer) notFound()
  const now = new Date()
  const availability = offerAvailability(offer, offer.tariffs, now, parisDay(now))

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
          {!availability.open ? (
            <Alert tone="warning" title={AVAILABILITY_LABELS[availability.reason]} />
          ) : null}
          {session ? (
            <p className="text-ink-muted">
              Les tarifs et la commande seront accessibles dès que le bureau aura validé votre adhésion.
            </p>
          ) : (
            <>
              <p className="text-ink-muted">
                Les tarifs négociés par l’Amicale et la commande sont réservés aux adhérents.
              </p>
              <div className="flex flex-col gap-3">
                <ButtonLink href={`/connexion?next=${encodeURIComponent(memberPath)}`}>
                  Se connecter pour commander
                </ButtonLink>
                <ButtonLink href="/inscription" variant="secondary">
                  Devenir adhérent
                </ButtonLink>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
