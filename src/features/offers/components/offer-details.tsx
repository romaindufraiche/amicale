import { CalendarDays, Clock, type LucideIcon, MapPin, Ticket, TimerOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/dates'
import { toParagraphs } from '@/lib/text'
import { OFFER_CATEGORY_LABELS, OFFER_KIND_LABELS } from '../labels'
import type { OfferWithTariffs } from '../queries'
import { OfferVisual } from './offer-visual'

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
        <Icon aria-hidden className="size-5 shrink-0 text-blue-500" />
        {label}
      </dt>
      <dd className={multiline ? 'pl-7 whitespace-pre-line' : 'pl-7 font-semibold'}>{children}</dd>
    </div>
  )
}

/** Fiche d'une offre (visuel, informations pratiques, description), affichée sur la page publique de l'offre. */
export function OfferDetails({ offer }: { offer: OfferWithTariffs }) {
  return (
    <article className="flex flex-col gap-8">
      <OfferVisual
        category={offer.category}
        imageId={offer.imageId}
        sizes="(min-width: 1024px) 800px, 100vw"
        className="aspect-[21/9] rounded-lg"
      />
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={offer.kind === 'EVENT' ? 'info' : 'neutral'}>{OFFER_KIND_LABELS[offer.kind]}</Badge>
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
  )
}
