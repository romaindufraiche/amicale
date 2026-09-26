import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { OfferForm } from '@/features/offers/components/offer-form'
import { EMPTY_OFFER } from '@/features/offers/form-values'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Nouvelle offre' }

export default async function NewOfferPage() {
  await requirePermission('offers:manage', '/admin/offres/nouvelle')
  return (
    <>
      <PageHeader
        eyebrow="Offres"
        title="Nouvelle offre"
        lead="L’offre est créée en brouillon : vous pourrez la relire avant de la mettre en ligne."
      />
      <OfferForm initial={EMPTY_OFFER} />
    </>
  )
}
