import { CalendarDays, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { formatDate, formatDateTime } from '@/lib/dates'
import { formatEuros, formatPrice } from '@/lib/money'
import type { OfferWithTariffs } from '../queries'
import { OFFER_CATEGORY_LABELS } from '../labels'
import { AVAILABILITY_LABELS, bestSavingPercent, lowestMemberPrice, type OfferAvailability } from '../rules'
import { OfferVisual } from './offer-visual'

type OfferCardProps = {
  offer: OfferWithTariffs
  availability: OfferAvailability
  href: string
  /** `public` : visiteur non connecté, le tarif adhérent n'est pas affiché. */
  audience?: 'member' | 'public'
  size?: 'default' | 'large'
  headingLevel?: 'h2' | 'h3'
}

/**
 * Carte d'offre du catalogue : visuel, informations, puis talon détachable (prix)
 * séparé par une perforation — le billet reste le motif signature de la billetterie.
 */
export function OfferCard({
  offer,
  availability,
  href,
  audience = 'member',
  size = 'default',
  headingLevel: Heading = 'h3',
}: OfferCardProps) {
  const activeTariffs = offer.tariffs.filter((tariff) => tariff.active)
  const price = lowestMemberPrice(offer.tariffs)
  const saving = bestSavingPercent(offer.tariffs)
  const single = activeTariffs.length === 1 ? activeTariffs[0] : undefined
  const lowStock = activeTariffs.some(
    (tariff) => tariff.stock !== null && tariff.stock > 0 && tariff.stock <= 10,
  )

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md bg-surface shadow-raised transition-shadow hover:shadow-overlay">
      <div className="relative">
        <OfferVisual
          category={offer.category}
          imagePath={offer.imagePath}
          sizes={
            size === 'large'
              ? '(min-width: 1024px) 600px, 100vw'
              : '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw'
          }
          className={cn(
            'transition-transform duration-300 group-hover:scale-[1.02]',
            size === 'large' ? 'aspect-[16/9]' : 'aspect-[16/10]',
          )}
        />
        <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
          {saving ? <Badge tone="highlight">−{saving} %</Badge> : null}
          {availability.open && lowStock ? <Badge tone="neutral">Dernières places</Badge> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="label-caps text-ink-muted">
          {OFFER_CATEGORY_LABELS[offer.category]} · {offer.kind === 'EVENT' ? 'Sortie' : 'E-billet'}
        </p>
        <Heading className={cn('font-display font-extrabold', size === 'large' ? 'text-h2' : 'text-h3')}>
          <Link href={href} className="group-hover:text-red-700 after:absolute after:inset-0">
            {offer.title}
          </Link>
        </Heading>
        <p className={cn('text-ink-muted', size === 'default' && 'line-clamp-2 text-sm')}>{offer.summary}</p>
        <p className="mt-auto flex items-center gap-1.5 pt-2 text-sm">
          {offer.eventStartsAt ? (
            <>
              <CalendarDays aria-hidden className="size-4 text-red-600" />
              {formatDateTime(offer.eventStartsAt)}
            </>
          ) : offer.validUntil ? (
            <>
              <Clock aria-hidden className="size-4 text-red-600" />
              Valable jusqu’au {formatDate(offer.validUntil)}
            </>
          ) : null}
        </p>
      </div>

      {/* Perforation : trait pointillé et deux encoches. */}
      <div aria-hidden className="relative mx-5 border-t-2 border-dashed border-line">
        <span className="absolute -top-2.5 -left-7.5 size-5 rounded-full bg-paper" />
        <span className="absolute -top-2.5 -right-7.5 size-5 rounded-full bg-paper" />
      </div>

      <div className="flex min-h-20 items-center justify-between gap-3 bg-sunken px-5 py-4">
        {!availability.open ? (
          <p className="font-display font-extrabold text-ink-muted">
            {AVAILABILITY_LABELS[availability.reason]}
          </p>
        ) : audience === 'public' ? (
          <p className="text-sm font-semibold">Tarif réservé aux adhérents</p>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="label-caps text-ink-muted">{single ? 'Tarif adhérent' : 'À partir de'}</span>
              <span className="font-display text-h3 font-black tabular">
                {price !== null ? formatPrice(price) : '—'}
              </span>
            </div>
            {single?.publicPriceCents && single.publicPriceCents > single.memberPriceCents ? (
              <span className="text-sm text-ink-muted">
                <span className="sr-only">Prix public : </span>
                <s className="tabular">{formatEuros(single.publicPriceCents)}</s>
              </span>
            ) : null}
          </>
        )}
      </div>
    </article>
  )
}
