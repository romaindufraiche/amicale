import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { ActionForm } from '@/components/ui/action-form'
import { getDocumentInfo } from '@/features/media/service'
import { deletePartnerAction } from '@/features/partners/actions'
import { PartnerForm } from '@/features/partners/components/partner-form'
import { getPartnerForAdmin } from '@/features/partners/queries'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Modifier un partenaire' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enregistre?: string }> }

export default async function EditPartnerPage({ params, searchParams }: Props) {
  const { id } = await params
  await requirePermission('partners:manage', `/admin/partenaires/${id}`)
  const partnerId = z.uuid().safeParse(id)
  const partner = partnerId.success ? await getPartnerForAdmin(partnerId.data) : null
  if (!partner) notFound()
  const saved = (await searchParams).enregistre === '1'
  const attachment = await getDocumentInfo(partner.attachmentId)

  return (
    <>
      <Link href="/admin/partenaires" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Partenaires
      </Link>
      <PageHeader eyebrow="Partenaires" title={partner.name} />
      {saved ? <Alert tone="success" title="Partenaire enregistré." /> : null}
      <PartnerForm
        key={partner.updatedAt.toISOString()}
        initial={{
          id: partner.id,
          name: partner.name,
          category: partner.category,
          advantage: partner.advantage ?? '',
          description: partner.description ?? '',
          howToBenefit: partner.howToBenefit ?? '',
          websiteUrl: partner.websiteUrl ?? '',
          imageId: partner.imageId,
          attachment,
          published: partner.published,
        }}
      />
      <section aria-labelledby="supprimer" className="flex flex-col gap-3 border-t border-line pt-8">
        <h2 id="supprimer" className="text-h3">
          Supprimer ce partenaire
        </h2>
        <p className="text-ink-muted">
          Il disparaîtra du site et de cette liste. Cette action est définitive.
        </p>
        <ActionForm
          action={deletePartnerAction}
          fields={{ partnerId: partner.id }}
          label="Supprimer le partenaire"
          variant="danger"
          confirm={`Supprimer définitivement « ${partner.name} » ?`}
        />
      </section>
    </>
  )
}
