import { Search } from 'lucide-react'
import Link from 'next/link'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Eyebrow } from '@/components/ui/page-header'
import { cn } from '@/lib/cn'
import { parisDay } from '@/lib/dates'
import type { OfferCategory } from '@/server/db/schema'
import { CATALOG_SORTS, catalogQuery, type CatalogParams } from '../catalog-params'
import { OFFER_CATEGORIES, OFFER_CATEGORY_LABELS } from '../labels'
import type { OfferWithTariffs } from '../queries'
import { offerAvailability } from '../rules'
import { OfferCard } from './offer-card'
import { CATEGORY_ICONS } from './offer-visual'

type OfferCatalogProps = {
  offers: OfferWithTariffs[]
  params: CatalogParams
  /** Chemin du catalogue : `/offres` (public) ou `/espace/billetterie` (adhérents). */
  basePath: string
  /** `public` : les tarifs des offres qui les réservent aux adhérents sont masqués. */
  audience: 'member' | 'public'
}

/** Catalogue des offres : recherche, tri, catégories, offres à la une puis liste complète. */
export function OfferCatalog({ offers, params, basePath, audience }: OfferCatalogProps) {
  const { category, search, sort } = params
  const now = new Date()
  const today = parisDay(now)
  const withAvailability = offers.map((offer) => ({
    offer,
    availability: offerAvailability(offer, offer.tariffs, now, today),
  }))
  // Offres ouvertes d'abord, les complètes ou closes en fin de liste.
  withAvailability.sort((a, b) => Number(b.availability.open) - Number(a.availability.open))
  const filtered = Boolean(category || search)
  const featured = filtered
    ? []
    : withAvailability.filter(({ offer, availability }) => offer.featured && availability.open).slice(0, 2)
  const others = withAvailability.filter((item) => !featured.includes(item))

  const categoryHref = (value?: OfferCategory) => `${basePath}${catalogQuery({ ...params, category: value })}`

  return (
    <>
      <div className="flex flex-col gap-5">
        <form
          method="get"
          action={basePath}
          role="search"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          {category ? <input type="hidden" name="categorie" value={category} /> : null}
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="catalogue-recherche" className="text-sm font-semibold">
              Rechercher une offre
            </label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
              />
              <input
                id="catalogue-recherche"
                name="q"
                type="search"
                defaultValue={search}
                maxLength={80}
                placeholder="Parc, concert, match, ville…"
                className="h-12 w-full rounded-sm border border-line-strong bg-surface pr-4 pl-12 hover:border-ink focus-visible:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="catalogue-tri" className="text-sm font-semibold">
              Trier par
            </label>
            <select
              id="catalogue-tri"
              name="tri"
              defaultValue={sort}
              className="h-12 rounded-sm border border-line-strong bg-surface px-3 hover:border-ink focus-visible:border-blue-500"
            >
              {Object.entries(CATALOG_SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={buttonClasses('primary', 'md')}>
            Rechercher
          </button>
        </form>

        <nav aria-label="Catégories">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {[undefined, ...OFFER_CATEGORIES].map((value) => {
              const active = value === category
              const Icon = value ? CATEGORY_ICONS[value] : null
              return (
                <li key={value ?? 'all'} className="shrink-0">
                  <Link
                    href={categoryHref(value)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm font-semibold transition-colors',
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-line-strong bg-surface text-ink hover:border-ink',
                    )}
                  >
                    {Icon ? <Icon aria-hidden className="size-4" /> : null}
                    {value ? OFFER_CATEGORY_LABELS[value] : 'Toutes les offres'}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {featured.length > 0 ? (
        <section aria-labelledby="a-la-une" className="flex flex-col gap-5">
          <Eyebrow>
            <span id="a-la-une">À la une</span>
          </Eyebrow>
          <ul className="grid gap-6 lg:grid-cols-2">
            {featured.map(({ offer, availability }) => (
              <li key={offer.id}>
                <OfferCard
                  offer={offer}
                  availability={availability}
                  href={`${basePath}/${offer.slug}`}
                  hidePrices={audience === 'public' && !offer.pricesPublic}
                  size="large"
                  headingLevel="h2"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="toutes-offres" className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4">
          <Eyebrow>
            <span id="toutes-offres">{filtered ? 'Résultats' : 'Toutes les offres'}</span>
          </Eyebrow>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {offers.length} offre{offers.length > 1 ? 's' : ''}
          </p>
        </div>
        {others.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map(({ offer, availability }) => (
              <li key={offer.id}>
                <OfferCard
                  offer={offer}
                  availability={availability}
                  href={`${basePath}/${offer.slug}`}
                  hidePrices={audience === 'public' && !offer.pricesPublic}
                  headingLevel="h2"
                />
              </li>
            ))}
          </ul>
        ) : offers.length === 0 ? (
          <EmptyState
            title={filtered ? 'Aucune offre ne correspond' : 'Aucune offre en ce moment'}
            action={
              filtered ? (
                <Link href={basePath} className={buttonClasses('secondary', 'sm')}>
                  Voir toutes les offres
                </Link>
              ) : undefined
            }
          >
            {filtered
              ? 'Essayez un autre mot-clé ou une autre catégorie.'
              : 'Les nouvelles offres de billetterie et les prochaines sorties seront publiées ici par le bureau.'}
          </EmptyState>
        ) : null}
      </section>
    </>
  )
}
