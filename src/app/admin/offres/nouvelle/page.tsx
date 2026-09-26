import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { OfferForm } from '@/features/offers/components/offer-form'
import { EMPTY_OFFER } from '@/features/offers/form-values'
import { OFFER_CATEGORIES, OFFER_CATEGORY_LABELS } from '@/features/offers/labels'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Nouvelle offre' }

type Props = { searchParams: Promise<{ categorie?: string }> }

export default async function NewOfferPage({ searchParams }: Props) {
  await requirePermission('offers:manage', '/admin/offres/nouvelle')
  const { categorie } = await searchParams
  // Catégorie présélectionnée depuis le bouton « Ajouter une offre » d'une catégorie.
  const category = OFFER_CATEGORIES.find((value) => value === categorie)
  return (
    <>
      <PageHeader
        eyebrow="Offres"
        title={category ? `Nouvelle offre — ${OFFER_CATEGORY_LABELS[category]}` : 'Nouvelle offre'}
        lead="L’offre est créée en brouillon : vous pourrez la relire avant de la mettre en ligne."
      />
      <OfferForm initial={category ? { ...EMPTY_OFFER, category } : EMPTY_OFFER} />
    </>
  )
}
