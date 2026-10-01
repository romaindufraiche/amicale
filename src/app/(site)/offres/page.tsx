import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { catalogQuery, parseCatalogParams, type CatalogSearchParams } from '@/features/offers/catalog-params'
import { OfferCatalog } from '@/features/offers/components/offer-catalog'
import { listPublishedOffers } from '@/features/offers/queries'
import { getCurrentSession } from '@/server/auth/session'

export const metadata: Metadata = {
  title: 'Billetterie & sorties',
  description:
    'Cinéma, parcs, spectacles, sport, voyages et sorties : les offres de l’Amicale des Policiers du Val d’Oise.',
  alternates: { canonical: '/offres' },
}

type Props = { searchParams: Promise<CatalogSearchParams> }

/** Catalogue consultable sans compte, tarifs compris ; la commande reste réservée aux adhérents. */
export default async function PublicCatalogPage({ searchParams }: Props) {
  const params = parseCatalogParams(await searchParams)
  const session = await getCurrentSession()
  // Un adhérent validé retrouve le catalogue complet (tarifs, commande) dans son espace.
  if (session?.user.status === 'ACTIVE') redirect(`/espace/billetterie${catalogQuery(params)}`)

  const offers = await listPublishedOffers(params)

  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader
        eyebrow="Billetterie & sorties"
        title="Les offres de l’Amicale"
        lead="Cinéma, parcs, spectacles, sport, voyages et sorties de l’Amicale. Tarifs négociés par l’Amicale, à commander depuis votre espace adhérent."
        actions={
          session ? null : (
            <>
              <ButtonLink href="/inscription">Devenir adhérent</ButtonLink>
              <ButtonLink href="/connexion?next=/espace/billetterie" variant="secondary">
                Se connecter
              </ButtonLink>
            </>
          )
        }
      />
      <OfferCatalog offers={offers} params={params} basePath="/offres" />
    </div>
  )
}
