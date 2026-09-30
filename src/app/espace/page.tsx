import { ArrowRight, Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { ButtonLink } from '@/components/ui/button'
import { Eyebrow, PageHeader } from '@/components/ui/page-header'
import { HighlightsMarquee } from '@/features/highlights/components/highlights-marquee'
import { listActiveHighlights } from '@/features/highlights/queries'
import { OfferCard } from '@/features/offers/components/offer-card'
import { listPublishedOffers } from '@/features/offers/queries'
import { offerAvailability } from '@/features/offers/rules'
import { OrderSummaryRow } from '@/features/orders/components/order-summary'
import { listOrdersForUser } from '@/features/orders/queries'
import { cn } from '@/lib/cn'
import { formatDate, parisDay } from '@/lib/dates'
import { isMembershipValid, requireUser } from '@/server/auth/guards'
import type { SessionUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Tableau de bord' }

function PendingRequest({ user }: { user: SessionUser }) {
  const steps = [
    { label: 'Compte créé', done: true },
    { label: 'Adresse email confirmée', done: user.status !== 'PENDING_VERIFICATION' },
    { label: 'Validation par le bureau', done: false },
  ]
  return (
    <>
      <PageHeader
        eyebrow="Demande d’adhésion"
        title={`Bonjour ${user.firstName}, votre demande est en cours d’examen.`}
        lead="Vous recevrez un email dès que le bureau aura validé votre adhésion. Vous aurez alors accès à la billetterie, aux sorties et aux avantages partenaires."
      />
      <ol className="flex max-w-prose flex-col gap-4">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-4">
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-full border-2',
                step.done ? 'border-success-800 bg-success-800 text-white' : 'border-line-strong bg-surface',
              )}
            >
              {step.done ? <Check aria-hidden className="size-5" /> : null}
            </span>
            <span className={cn('font-semibold', !step.done && 'text-ink-muted')}>
              {step.label}
              <span className="sr-only">{step.done ? ' : fait' : ' : en attente'}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-ink-muted">
        Une question sur votre demande ?{' '}
        <Link href="/contact" className="link">
          Contactez le bureau
        </Link>
        .
      </p>
    </>
  )
}

export default async function DashboardPage() {
  const user = await requireUser('/espace')
  if (user.status !== 'ACTIVE') return <PendingRequest user={user} />

  const [offers, orders, highlights] = await Promise.all([
    listPublishedOffers(),
    listOrdersForUser(user.id),
    listActiveHighlights({ includeMembersOnly: true }),
  ])
  const now = new Date()
  const today = parisDay(now)
  const openOffers = offers
    .map((offer) => ({ offer, availability: offerAvailability(offer, offer.tariffs, now, today) }))
    .filter(({ availability }) => availability.open)
    .sort((a, b) => Number(b.offer.featured) - Number(a.offer.featured))
    .slice(0, 3)
  const pendingPayment = orders.filter((order) => order.status === 'PENDING_PAYMENT')
  const valid = isMembershipValid(user)

  return (
    <>
      <PageHeader eyebrow="Tableau de bord" title={`Bonjour ${user.firstName}`} />

      <HighlightsMarquee items={highlights} />

      <section aria-label="Mon adhésion" className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* Carte d'adhérent : bandeau sombre reprenant le sigle et le numéro. */}
        <div
          data-surface="dark"
          className="flex flex-col justify-between gap-8 rounded-lg bg-blue-900 p-6 text-white"
        >
          <div className="flex items-start justify-between">
            <p className="font-display text-h3 font-black">
              ADP<span className="text-red-500">VO</span>
            </p>
            <span className="label-caps text-amber-300">Carte d’adhérent</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lead font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="label-caps text-line tabular">N° {user.memberNumber ?? '—'}</p>
          </div>
          <div className="brand-rule" aria-hidden />
          <p className="text-sm">
            {user.membershipValidUntil ? (
              <>
                {valid ? 'Valable jusqu’au' : 'Expirée depuis le'}{' '}
                <strong>{formatDate(user.membershipValidUntil)}</strong>
              </>
            ) : (
              'Date de validité non renseignée'
            )}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {!valid ? (
            <Alert tone="warning" title="Votre cotisation n’est plus à jour.">
              Pour continuer à commander, renouvelez votre adhésion auprès du bureau.{' '}
              <Link href="/contact">Contacter le bureau</Link>
            </Alert>
          ) : null}
          {pendingPayment.length > 0 ? (
            <Alert
              tone="info"
              title={`${pendingPayment.length} commande${pendingPayment.length > 1 ? 's' : ''} en attente de règlement`}
            >
              <Link href="/espace/commandes">Voir mes commandes</Link>
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/espace/billetterie"
              className="group flex flex-col gap-2 rounded-md bg-surface p-5 hover:shadow-raised"
            >
              <span className="font-display text-lead font-extrabold group-hover:text-blue-600">
                Billetterie & sorties
              </span>
              <span className="text-sm text-ink-muted">Commander des billets à tarif adhérent.</span>
            </Link>
            <Link
              href="/espace/avantages"
              className="group flex flex-col gap-2 rounded-md bg-surface p-5 hover:shadow-raised"
            >
              <span className="font-display text-lead font-extrabold group-hover:text-blue-600">
                Avantages partenaires
              </span>
              <span className="text-sm text-ink-muted">Réductions et conditions négociées.</span>
            </Link>
          </div>
        </div>
      </section>

      {openOffers.length > 0 ? (
        <section aria-labelledby="a-la-une" className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <Eyebrow>
              <span id="a-la-une">À ne pas manquer</span>
            </Eyebrow>
            <Link
              href="/espace/billetterie"
              className="inline-flex items-center gap-2 text-sm font-semibold link"
            >
              Toutes les offres <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {openOffers.map(({ offer, availability }) => (
              <li key={offer.id}>
                <OfferCard
                  offer={offer}
                  availability={availability}
                  href={`/espace/billetterie/${offer.slug}`}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="dernieres-commandes" className="flex flex-col gap-6">
        <Eyebrow>
          <span id="dernieres-commandes">Mes dernières commandes</span>
        </Eyebrow>
        {orders.length > 0 ? (
          <ul className="border-t border-line">
            {orders.slice(0, 3).map((order) => (
              <OrderSummaryRow key={order.id} order={order} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-ink-muted">Vous n’avez pas encore passé de commande.</p>
            <ButtonLink href="/espace/billetterie" variant="secondary" size="sm">
              Découvrir les offres
            </ButtonLink>
          </div>
        )}
      </section>
    </>
  )
}
