import type { Offer, OfferTariff } from '@/server/db/schema'

type OfferTiming = Pick<Offer, 'status' | 'kind' | 'orderDeadline' | 'eventStartsAt' | 'validUntil'>

export type OfferAvailability =
  | { open: true }
  | { open: false; reason: 'NOT_PUBLISHED' | 'DEADLINE_PASSED' | 'EVENT_PASSED' | 'EXPIRED' | 'SOLD_OUT' }

/**
 * Une offre est commandable si elle est en ligne, que la date limite n'est pas
 * dépassée, que la sortie n'a pas eu lieu, que les billets sont encore valables
 * et qu'il reste au moins une place sur un tarif actif.
 */
export function offerAvailability(
  offer: OfferTiming,
  tariffs: readonly Pick<OfferTariff, 'stock' | 'active'>[],
  now: Date,
  today: string,
): OfferAvailability {
  if (offer.status !== 'PUBLISHED') return { open: false, reason: 'NOT_PUBLISHED' }
  if (offer.orderDeadline && offer.orderDeadline <= now) return { open: false, reason: 'DEADLINE_PASSED' }
  if (offer.kind === 'EVENT' && offer.eventStartsAt && offer.eventStartsAt <= now) {
    return { open: false, reason: 'EVENT_PASSED' }
  }
  if (offer.validUntil && offer.validUntil < today) return { open: false, reason: 'EXPIRED' }
  const activeTariffs = tariffs.filter((tariff) => tariff.active)
  if (
    activeTariffs.length === 0 ||
    activeTariffs.every((tariff) => tariff.stock !== null && tariff.stock <= 0)
  ) {
    return { open: false, reason: 'SOLD_OUT' }
  }
  return { open: true }
}

export const AVAILABILITY_LABELS: Record<Exclude<OfferAvailability, { open: true }>['reason'], string> = {
  NOT_PUBLISHED: "Cette offre n'est pas disponible.",
  DEADLINE_PASSED: 'Les commandes sont closes.',
  EVENT_PASSED: 'Cette sortie a déjà eu lieu.',
  EXPIRED: 'Ces billets ne sont plus valables.',
  SOLD_OUT: 'Complet',
}

/** Plus petit prix adhérent parmi les tarifs actifs (pour « à partir de »). */
export function lowestMemberPrice(
  tariffs: readonly Pick<OfferTariff, 'memberPriceCents' | 'active'>[],
): number | null {
  const prices = tariffs.filter((tariff) => tariff.active).map((tariff) => tariff.memberPriceCents)
  return prices.length > 0 ? Math.min(...prices) : null
}

/** Économie maximale en pourcentage par rapport au prix public, arrondie à l'entier inférieur. */
export function bestSavingPercent(
  tariffs: readonly Pick<OfferTariff, 'memberPriceCents' | 'publicPriceCents' | 'active'>[],
): number | null {
  const savings = tariffs.flatMap((tariff) => {
    const publicPrice = tariff.publicPriceCents
    if (!tariff.active || !publicPrice || publicPrice <= tariff.memberPriceCents) return []
    return [Math.floor(((publicPrice - tariff.memberPriceCents) / publicPrice) * 100)]
  })
  return savings.length > 0 ? Math.max(...savings) : null
}
