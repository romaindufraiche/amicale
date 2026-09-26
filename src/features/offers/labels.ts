import type { OfferCategory, OfferKind, PublicationStatus } from '@/server/db/schema'

export const OFFER_CATEGORY_LABELS: Record<OfferCategory, string> = {
  CINEMA: 'Cinéma',
  PARCS: 'Parcs & loisirs',
  SPECTACLES: 'Spectacles & culture',
  SPORT: 'Sport',
  VOYAGES: 'Voyages & séjours',
  FAMILLE: 'Famille & enfants',
  AUTRE: 'Autres',
}

export const OFFER_CATEGORIES = Object.keys(OFFER_CATEGORY_LABELS) as OfferCategory[]

export const OFFER_KIND_LABELS: Record<OfferKind, string> = {
  TICKET: 'Billetterie',
  EVENT: 'Sortie',
}

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'En ligne',
  ARCHIVED: 'Archivée',
}
