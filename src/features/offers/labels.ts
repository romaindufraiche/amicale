import type { OfferCategory, OfferKind, PublicationStatus } from '@/server/db/schema'

/** Ordre d'affichage des catégories (filtres, accès rapide, espace bureau). */
export const OFFER_CATEGORY_LABELS: Record<OfferCategory, string> = {
  PARCS: 'Parcs & loisirs',
  CINEMA: 'Cinéma',
  VOYAGES: 'Voyages & séjours',
  SPORT: 'Sport',
  EPICERIE: 'Épicerie fine',
  PARFUMERIE: 'Parfumerie',
  AUTRE: 'Divers',
}

export const OFFER_CATEGORIES = Object.keys(OFFER_CATEGORY_LABELS) as OfferCategory[]

export const OFFER_KIND_LABELS: Record<OfferKind, string> = {
  TICKET: 'Billetterie',
  EVENT: 'Sortie',
  OTHER: 'Autre',
}

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'En ligne',
  ARCHIVED: 'Archivée',
}
