import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { PartnerForm } from '@/features/partners/components/partner-form'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Nouveau partenaire' }

export default async function NewPartnerPage() {
  await requirePermission('partners:manage', '/admin/partenaires/nouveau')
  return (
    <>
      <PageHeader eyebrow="Partenaires" title="Nouveau partenaire" />
      <PartnerForm
        initial={{
          name: '',
          category: 'AUTRE',
          advantage: '',
          description: '',
          howToBenefit: '',
          websiteUrl: '',
          published: false,
        }}
      />
    </>
  )
}
