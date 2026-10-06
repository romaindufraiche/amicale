import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { parseCatalogParams, type CatalogSearchParams } from '@/features/offers/catalog-params'
import { OfferCatalog } from '@/features/offers/components/offer-catalog'
import { listPublishedOffers } from '@/features/offers/queries'
import { JoinLink } from '@/features/settings/components/join-link'

export const metadata: Metadata = {
  title: 'Billetterie & sorties',
  description:
    'Cinéma, parcs, spectacles, sport, voyages et sorties : les offres de l’Amicale des Policiers du Val d’Oise.',
  alternates: { canonical: '/offres' },
}

type Props = { searchParams: Promise<CatalogSearchParams> }

/** Catalogue public des offres ; la commande se fait depuis la fiche de chaque offre. */
export default async function PublicCatalogPage({ searchParams }: Props) {
  const params = parseCatalogParams(await searchParams)
  const offers = await listPublishedOffers(params)

  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader
        eyebrow="Billetterie & sorties"
        title="Les offres de l’Amicale"
        lead="Cinéma, parcs, spectacles, sport, voyages et sorties de l’Amicale. Tarifs négociés par l’Amicale : commandez en ligne depuis la fiche de chaque offre."
        actions={<JoinLink>Adhérer à l’Amicale</JoinLink>}
      />
      <OfferCatalog offers={offers} params={params} basePath="/offres" />
    </div>
  )
}
