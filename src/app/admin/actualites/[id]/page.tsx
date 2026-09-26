import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ActionForm } from '@/components/ui/action-form'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { setNewsStatusAction } from '@/features/news/actions'
import { NewsForm } from '@/features/news/components/news-form'
import { getNewsForAdmin } from '@/features/news/queries'
import { PUBLICATION_STATUS_LABELS } from '@/features/offers/labels'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Modifier une actualité' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enregistree?: string }> }

export default async function EditNewsPage({ params, searchParams }: Props) {
  const { id } = await params
  await requirePermission('news:manage', `/admin/actualites/${id}`)
  const newsId = z.uuid().safeParse(id)
  const item = newsId.success ? await getNewsForAdmin(newsId.data) : null
  if (!item) notFound()
  const saved = (await searchParams).enregistree === '1'

  return (
    <>
      <Link href="/admin/actualites" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Actualités
      </Link>
      <PageHeader
        eyebrow="Actualités"
        title={item.title}
        lead={
          <Badge tone={item.status === 'PUBLISHED' ? 'success' : 'warning'}>
            {PUBLICATION_STATUS_LABELS[item.status]}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-3">
            {item.status === 'PUBLISHED' ? (
              <>
                <Link href={`/actualites/${item.slug}`} className="self-center text-sm font-semibold link">
                  Voir sur le site
                </Link>
                <ActionForm
                  action={setNewsStatusAction}
                  fields={{ newsId: item.id, status: 'DRAFT' }}
                  label="Dépublier"
                  size="md"
                />
              </>
            ) : (
              <ActionForm
                action={setNewsStatusAction}
                fields={{ newsId: item.id, status: 'PUBLISHED' }}
                label="Publier"
                variant="primary"
                size="md"
              />
            )}
          </div>
        }
      />
      {saved ? <Alert tone="success" title="Actualité enregistrée." /> : null}
      <NewsForm
        key={item.updatedAt.toISOString()}
        initial={{
          id: item.id,
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          body: item.body,
          visibility: item.visibility,
        }}
      />
    </>
  )
}
