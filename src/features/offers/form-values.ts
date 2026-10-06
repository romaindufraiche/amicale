import 'server-only'
import { centsToInput } from '@/lib/money'
import { toParisDateTimeInput } from '@/lib/dates'
import type { OfferFormValues } from './components/offer-form'
import type { OfferWithTariffs } from './queries'

export const EMPTY_OFFER: OfferFormValues = {
  title: '',
  slug: '',
  kind: 'TICKET',
  category: 'CINEMA',
  summary: '',
  description: '',
  pickupInfo: '',
  location: '',
  eventStartsAt: '',
  validUntil: '',
  orderDeadline: '',
  imageId: null,
  featured: false,
  pricesPublic: true,
  helloassoUrl: '',
  tariffs: [],
}

/** Convertit une offre en base en valeurs de formulaire (montants en euros, dates à l'heure de Paris). */
export function offerToFormValues(offer: OfferWithTariffs): OfferFormValues {
  return {
    id: offer.id,
    title: offer.title,
    slug: offer.slug,
    kind: offer.kind,
    category: offer.category,
    summary: offer.summary,
    description: offer.description,
    pickupInfo: offer.pickupInfo ?? '',
    location: offer.location ?? '',
    eventStartsAt: toParisDateTimeInput(offer.eventStartsAt),
    validUntil: offer.validUntil ?? '',
    orderDeadline: toParisDateTimeInput(offer.orderDeadline),
    imageId: offer.imageId,
    featured: offer.featured,
    pricesPublic: offer.pricesPublic,
    helloassoUrl: offer.helloassoUrl ?? '',
    tariffs: offer.tariffs.map((tariff) => ({
      key: tariff.id,
      id: tariff.id,
      label: tariff.label,
      memberPrice: centsToInput(tariff.memberPriceCents),
      publicPrice: centsToInput(tariff.publicPriceCents),
      stock: tariff.stock?.toString() ?? '',
      active: tariff.active,
    })),
  }
}
