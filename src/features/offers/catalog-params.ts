import type { OfferCategory } from '@/server/db/schema'
import { OFFER_CATEGORIES } from './labels'
import type { OfferSort } from './queries'

export const CATALOG_SORTS: Record<OfferSort, string> = {
  date: 'Prochaines dates',
  recent: 'Nouveautés',
  prix: 'Prix croissant',
}

export type CatalogSearchParams = { categorie?: string; q?: string; tri?: string }

export type CatalogParams = { category?: OfferCategory; search: string; sort: OfferSort }

function isCategory(value: unknown): value is OfferCategory {
  return typeof value === 'string' && (OFFER_CATEGORIES as string[]).includes(value)
}

function isSort(value: unknown): value is OfferSort {
  return typeof value === 'string' && value in CATALOG_SORTS
}

/** Paramètres d'URL du catalogue : valeurs inconnues ignorées, recherche bornée. */
export function parseCatalogParams(params: CatalogSearchParams): CatalogParams {
  return {
    category: isCategory(params.categorie) ? params.categorie : undefined,
    search: typeof params.q === 'string' ? params.q.trim().slice(0, 80) : '',
    sort: isSort(params.tri) ? params.tri : 'date',
  }
}

/** Chaîne de requête canonique (sans les valeurs par défaut), précédée de « ? » si non vide. */
export function catalogQuery({ category, search, sort }: CatalogParams): string {
  const qs = new URLSearchParams()
  if (category) qs.set('categorie', category)
  if (search) qs.set('q', search)
  if (sort !== 'date') qs.set('tri', sort)
  const text = qs.toString()
  return text ? `?${text}` : ''
}
