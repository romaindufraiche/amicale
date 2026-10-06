import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ActionForm } from '@/components/ui/action-form'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { setOfferStatusAction } from '@/features/offers/actions'
import { OfferForm } from '@/features/offers/components/offer-form'
import { offerToFormValues } from '@/features/offers/form-values'
import { PUBLICATION_STATUS_LABELS } from '@/features/offers/labels'
import { getOfferForAdmin } from '@/features/offers/queries'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Modifier une offre' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enregistree?: string }> }

export default async function EditOfferPage({ params, searchParams }: Props) {
  const { id } = await params
  await requirePermission('offers:manage', `/admin/offres/${id}`)
  const offerId = z.uuid().safeParse(id)
  const offer = offerId.success ? await getOfferForAdmin(offerId.data) : null
  if (!offer) notFound()
  const saved = (await searchParams).enregistree === '1'

  return (
    <>
      <Link href="/admin/offres" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Offres
      </Link>
      <PageHeader
        eyebrow="Offres"
        title={offer.title}
        lead={
          <Badge tone={offer.status === 'PUBLISHED' ? 'success' : 'warning'}>
            {PUBLICATION_STATUS_LABELS[offer.status]}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-3">
            {offer.status !== 'PUBLISHED' ? (
              <ActionForm
                action={setOfferStatusAction}
                fields={{ offerId: offer.id, status: 'PUBLISHED' }}
                label="Mettre en ligne"
                variant="primary"
                size="md"
              />
            ) : (
              <ActionForm
                action={setOfferStatusAction}
                fields={{ offerId: offer.id, status: 'DRAFT' }}
                label="Retirer de la vente"
                size="md"
              />
            )}
            {offer.status !== 'ARCHIVED' ? (
              <ActionForm
                action={setOfferStatusAction}
                fields={{ offerId: offer.id, status: 'ARCHIVED' }}
                label="Archiver"
                variant="ghost"
                size="md"
                confirm="Archiver cette offre ? Elle ne sera plus visible sur le site ; ses commandes sont conservées."
              />
            ) : null}
          </div>
        }
      />
      {saved ? <Alert tone="success" title="Offre enregistrée." /> : null}
      <OfferForm key={offer.updatedAt.toISOString()} initial={offerToFormValues(offer)} />
    </>
  )
}
