import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { parseCatalogParams, type CatalogSearchParams } from '@/features/offers/catalog-params'
import { OfferCatalog } from '@/features/offers/components/offer-catalog'
import { listPublishedOffers } from '@/features/offers/queries'
import { isMembershipValid, requireActiveMember } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Billetterie & sorties' }

type Props = { searchParams: Promise<CatalogSearchParams> }

export default async function CatalogPage({ searchParams }: Props) {
  const user = await requireActiveMember('/espace/billetterie')
  const params = parseCatalogParams(await searchParams)
  const offers = await listPublishedOffers(params)

  return (
    <>
      <PageHeader
        eyebrow="Réservé aux adhérents"
        title="Billetterie & sorties"
        lead="Cinéma, parcs, spectacles, sport, voyages et sorties de l’Amicale, aux tarifs négociés pour les adhérents."
      />

      {!isMembershipValid(user) ? (
        <Alert tone="warning" title="Votre cotisation n’est plus à jour.">
          Vous pouvez consulter les offres, mais pas commander. Contactez le bureau pour renouveler votre
          adhésion.
        </Alert>
      ) : null}

      <OfferCatalog offers={offers} params={params} basePath="/espace/billetterie" audience="member" />
    </>
  )
}
