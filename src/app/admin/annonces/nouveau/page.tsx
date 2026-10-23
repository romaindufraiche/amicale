import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { ClassifiedForm } from '@/features/classifieds/components/classified-form'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Nouvelle annonce' }

export default async function NewClassifiedPage() {
  await requirePermission('classifieds:manage', '/admin/annonces/nouveau')
  return (
    <>
      <PageHeader eyebrow="Annonces" title="Nouvelle annonce" />
      <ClassifiedForm
        initial={{ kind: '', title: '', description: '', imageId: null, pinned: false, published: true }}
      />
    </>
  )
}
