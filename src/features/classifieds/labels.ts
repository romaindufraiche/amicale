import type { ClassifiedKind } from '@/server/db/schema'

/** Durée de vie d'une annonce : elle est supprimée automatiquement au-delà (voir service). */
export const CLASSIFIED_LIFETIME_DAYS = 45

/** Date de suppression automatique d'une annonce. */
export function classifiedExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + CLASSIFIED_LIFETIME_DAYS * 24 * 60 * 60 * 1000)
}

/** Types d'annonce, dans l'ordre du menu déroulant. */
export const CLASSIFIED_KINDS: Record<ClassifiedKind, { label: string; slug: string; tone: string }> = {
  VENTE: { label: 'Vente', slug: 'vente', tone: 'bg-blue-600 text-white' },
  LOCATION: { label: 'Location', slug: 'location', tone: 'bg-amber-300 text-ink' },
  PRET: { label: 'Prêt', slug: 'pret', tone: 'bg-blue-50 text-blue-700' },
  DON: { label: 'Don', slug: 'don', tone: 'bg-rose-600 text-white' },
  TROC: { label: 'Troc', slug: 'troc', tone: 'bg-night-900 text-white' },
}

export const CLASSIFIED_KIND_VALUES = Object.keys(CLASSIFIED_KINDS) as ClassifiedKind[]

/** Type d'annonce lu depuis l'URL (?type=vente) ; valeur inconnue ignorée. */
export function parseClassifiedKind(slug: string | undefined): ClassifiedKind | null {
  return CLASSIFIED_KIND_VALUES.find((kind) => CLASSIFIED_KINDS[kind].slug === slug) ?? null
}
