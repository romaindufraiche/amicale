import { ArrowLeft, CalendarDays, Clock, type LucideIcon, MapPin, Ticket, TimerOff } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { cache, type ReactNode } from 'react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { OrderForm } from '@/features/orders/components/order-form'
import { OfferVisual } from '@/features/offers/components/offer-visual'
import { OFFER_CATEGORY_LABELS, OFFER_KIND_LABELS } from '@/features/offers/labels'
import { getPublishedOfferBySlug, quantityOrderedBy } from '@/features/offers/queries'
import { AVAILABILITY_LABELS, offerAvailability } from '@/features/offers/rules'
import { formatDate, formatDateTime, parisDay } from '@/lib/dates'
import { toParagraphs } from '@/lib/text'
import { isMembershipValid, requireActiveMember } from '@/server/auth/guards'

type Props = { params: Promise<{ slug: string }> }

/** Élément de la fiche pratique : l'icône décorative est placée dans le terme (dt). */
function DetailItem({
  icon: Icon,
  label,
  wide,
  multiline,
  children,
}: {
  icon: LucideIcon
  label: string
  wide?: boolean
  multiline?: boolean
  children: ReactNode
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="flex items-center gap-2 label-caps text-ink-muted">
        <Icon aria-hidden className="size-5 shrink-0 text-red-600" />
        {label}
      </dt>
      <dd className={multiline ? 'pl-7 whitespace-pre-line' : 'pl-7 font-semibold'}>{children}</dd>
    </div>
  )
}

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
        <article className="flex flex-col gap-8">
          <OfferVisual
            category={offer.category}
            imagePath={offer.imagePath}
            sizes="(min-width: 1024px) 800px, 100vw"
            className="aspect-[21/9] rounded-lg"
          />
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={offer.kind === 'EVENT' ? 'info' : 'neutral'}>
                {OFFER_KIND_LABELS[offer.kind]}
              </Badge>
              <span className="label-caps text-ink-muted">{OFFER_CATEGORY_LABELS[offer.category]}</span>
            </div>
            <h1 className="text-h1">{offer.title}</h1>
            <p className="max-w-prose text-lead text-ink-muted">{offer.summary}</p>
          </header>

          <dl className="grid gap-4 rounded-md bg-surface p-6 sm:grid-cols-2">
            {offer.eventStartsAt ? (
              <DetailItem icon={CalendarDays} label="Date">
                {formatDateTime(offer.eventStartsAt)}
              </DetailItem>
            ) : null}
            {offer.location ? (
              <DetailItem icon={MapPin} label="Lieu">
                {offer.location}
              </DetailItem>
            ) : null}
            {offer.validUntil ? (
              <DetailItem icon={Clock} label="Validité des billets">
                Jusqu’au {formatDate(offer.validUntil)}
              </DetailItem>
            ) : null}
            {offer.orderDeadline ? (
              <DetailItem icon={TimerOff} label="Commandes jusqu’au">
                {formatDateTime(offer.orderDeadline)}
              </DetailItem>
            ) : null}
            {offer.pickupInfo ? (
              <DetailItem icon={Ticket} label="Remise des billets" wide multiline>
                {offer.pickupInfo}
              </DetailItem>
            ) : null}
          </dl>

          <div className="flex max-w-prose flex-col gap-5">
            {toParagraphs(offer.description).map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </article>

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
