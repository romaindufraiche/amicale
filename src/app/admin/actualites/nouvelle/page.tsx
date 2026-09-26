import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { NewsForm } from '@/features/news/components/news-form'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Nouvelle actualité' }

export default async function NewNewsPage() {
  await requirePermission('news:manage', '/admin/actualites/nouvelle')
  return (
    <>
      <PageHeader
        eyebrow="Actualités"
        title="Nouvelle actualité"
        lead="Enregistrée en brouillon, à publier ensuite."
      />
      <NewsForm initial={{ title: '', slug: '', excerpt: '', body: '', visibility: 'PUBLIC' }} />
    </>
  )
}
