import { CalendarDays, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/dates'
import { formatEuros } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { OfferWithTariffs } from '../queries'
import { OFFER_CATEGORY_LABELS, OFFER_KIND_LABELS } from '../labels'
import { AVAILABILITY_LABELS, bestSavingPercent, lowestMemberPrice, type OfferAvailability } from '../rules'

/**
 * Carte « billet » du catalogue : talon détachable (prix) séparé par une perforation.
 * Le motif est fonctionnel — il distingue d'un coup d'œil ce qui se commande.
 */
export function OfferTicket({
  offer,
  availability,
}: {
  offer: OfferWithTariffs
  availability: OfferAvailability
}) {
  const price = lowestMemberPrice(offer.tariffs)
  const saving = bestSavingPercent(offer.tariffs)
  const multiplePrices =
    new Set(offer.tariffs.filter((t) => t.active).map((t) => t.memberPriceCents)).size > 1

  return (
    <article
      className={cn(
        'group relative grid overflow-hidden rounded-md bg-surface shadow-raised transition-shadow hover:shadow-overlay',
        'sm:grid-cols-[1fr_12rem]',
      )}
    >
      <div className="flex flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={offer.kind === 'EVENT' ? 'info' : 'neutral'}>{OFFER_KIND_LABELS[offer.kind]}</Badge>
          <span className="label-caps text-ink-muted">{OFFER_CATEGORY_LABELS[offer.category]}</span>
        </div>
        <h3 className="font-display text-h3 font-extrabold">
          <Link
            href={`/espace/billetterie/${offer.slug}`}
            className="group-hover:text-red-700 after:absolute after:inset-0"
          >
            {offer.title}
          </Link>
        </h3>
        <p className="text-ink-muted">{offer.summary}</p>
        <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-1.5 pt-2 text-sm">
          {offer.eventStartsAt ? (
            <li className="flex items-center gap-1.5">
              <CalendarDays aria-hidden className="size-4 text-red-600" />
              {formatDateTime(offer.eventStartsAt)}
            </li>
          ) : null}
          {offer.location ? (
            <li className="flex items-center gap-1.5">
              <MapPin aria-hidden className="size-4 text-red-600" />
              {offer.location}
            </li>
          ) : null}
          {offer.validUntil ? (
            <li className="flex items-center gap-1.5">
              <Clock aria-hidden className="size-4 text-red-600" />
              Valable jusqu’au {formatDate(offer.validUntil)}
            </li>
          ) : null}
        </ul>
      </div>

      {/* Perforation : trait pointillé et deux encoches. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-36 border-t-2 border-dashed border-line sm:inset-x-auto sm:inset-y-0 sm:right-48 sm:bottom-auto sm:border-t-0 sm:border-l-2"
      >
        <span className="absolute -top-2.5 -left-2.5 size-5 rounded-full bg-paper sm:-top-2.5 sm:-left-3" />
        <span className="absolute -top-2.5 -right-2.5 size-5 rounded-full bg-paper sm:top-auto sm:-bottom-2.5 sm:-left-3" />
      </div>

      <div className="flex h-36 flex-col items-start justify-center gap-1 bg-sunken px-6 sm:h-auto">
        {availability.open ? (
          <>
            <p className="label-caps text-ink-muted">{multiplePrices ? 'À partir de' : 'Tarif adhérent'}</p>
            <p className="font-display text-h2 font-black text-ink tabular">
              {price !== null ? formatEuros(price) : '—'}
            </p>
            {saving ? <Badge tone="highlight">Jusqu’à −{saving} %</Badge> : null}
          </>
        ) : (
          <p className="font-display text-lead font-extrabold text-ink-muted">
            {AVAILABILITY_LABELS[availability.reason]}
          </p>
        )}
      </div>
    </article>
  )
}
