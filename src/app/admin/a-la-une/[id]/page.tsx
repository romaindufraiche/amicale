import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ActionForm } from '@/components/ui/action-form'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { deleteHighlightAction } from '@/features/highlights/actions'
import { HighlightForm } from '@/features/highlights/components/highlight-form'
import { getHighlightForAdmin } from '@/features/highlights/queries'
import { toParisDateTimeInput } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Modifier un post' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enregistre?: string }> }

export default async function EditHighlightPage({ params, searchParams }: Props) {
  const { id } = await params
  await requirePermission('news:manage', `/admin/a-la-une/${id}`)
  const highlightId = z.uuid().safeParse(id)
  const item = highlightId.success ? await getHighlightForAdmin(highlightId.data) : null
  if (!item) notFound()
  const saved = (await searchParams).enregistre === '1'

  return (
    <>
      <Link href="/admin/a-la-une" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> À la une
      </Link>
      <PageHeader
        eyebrow="À la une"
        title={item.title}
        actions={
          <ActionForm
            action={deleteHighlightAction}
            fields={{ highlightId: item.id }}
            label="Supprimer"
            variant="danger"
            size="md"
            confirm="Supprimer définitivement ce post ?"
          />
        }
      />
      {saved ? <Alert tone="success" title="Post enregistré." /> : null}
      <HighlightForm
        key={item.updatedAt.toISOString()}
        initial={{
          id: item.id,
          title: item.title,
          body: item.body,
          linkUrl: item.linkUrl ?? '',
          linkLabel: item.linkLabel ?? '',
          tone: item.tone,
          imageId: item.imageId,
          visibility: item.visibility,
          startsAt: toParisDateTimeInput(item.startsAt),
          endsAt: toParisDateTimeInput(item.endsAt),
          position: String(item.position),
          published: item.published,
        }}
      />
    </>
  )
}
