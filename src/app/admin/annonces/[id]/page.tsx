import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ActionForm } from '@/components/ui/action-form'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { deleteClassifiedAction } from '@/features/classifieds/actions'
import { ClassifiedForm } from '@/features/classifieds/components/classified-form'
import { getClassifiedForAdmin } from '@/features/classifieds/queries'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Modifier une annonce' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enregistre?: string }> }

export default async function EditClassifiedPage({ params, searchParams }: Props) {
  const { id } = await params
  await requirePermission('classifieds:manage', `/admin/annonces/${id}`)
  const classifiedId = z.uuid().safeParse(id)
  const item = classifiedId.success ? await getClassifiedForAdmin(classifiedId.data) : null
  if (!item) notFound()
  const saved = (await searchParams).enregistre === '1'

  return (
    <>
      <Link href="/admin/annonces" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Annonces
      </Link>
      <PageHeader
        eyebrow="Annonces"
        title={item.title}
        actions={
          <ActionForm
            action={deleteClassifiedAction}
            fields={{ classifiedId: item.id }}
            label="Supprimer"
            variant="danger"
            size="md"
            confirm="Supprimer définitivement cette annonce ?"
          />
        }
      />
      {saved ? <Alert tone="success" title="Annonce enregistrée." /> : null}
      <ClassifiedForm
        key={item.updatedAt.toISOString()}
        initial={{
          id: item.id,
          kind: item.kind,
          title: item.title,
          description: item.description,
          imageId: item.imageId,
          pinned: item.pinned,
          published: item.published,
        }}
      />
    </>
  )
}
