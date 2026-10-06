import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { HighlightForm } from '@/features/highlights/components/highlight-form'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Nouveau post' }

export default async function NewHighlightPage() {
  await requirePermission('news:manage', '/admin/a-la-une/nouveau')
  return (
    <>
      <PageHeader eyebrow="À la une" title="Nouveau post" />
      <HighlightForm
        initial={{
          title: '',
          body: '',
          linkUrl: '',
          linkLabel: '',
          tone: 'RED',
          imageId: null,
          startsAt: '',
          endsAt: '',
          position: '0',
          published: true,
        }}
      />
    </>
  )
}
