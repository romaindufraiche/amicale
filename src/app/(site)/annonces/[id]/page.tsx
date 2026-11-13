import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { z } from 'zod'
import { Eyebrow } from '@/components/ui/page-header'
import { InterestForm } from '@/features/classifieds/components/interest-form'
import { CLASSIFIED_KINDS, classifiedExpiresAt } from '@/features/classifieds/labels'
import { site } from '@/config/site'
import { getPublishedClassified } from '@/features/classifieds/queries'
import { FramedImage } from '@/features/media/components/framed-image'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/dates'
import { toParagraphs } from '@/lib/text'

type Props = { params: Promise<{ id: string }> }

const loadClassified = cache(async (id: string) => {
  const parsed = z.uuid().safeParse(id)
  return parsed.success ? getPublishedClassified(parsed.data) : null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await loadClassified((await params).id)
  return item ? { title: item.title } : { title: 'Annonce introuvable' }
}

export default async function ClassifiedPage({ params }: Props) {
  const item = await loadClassified((await params).id)
  if (!item) notFound()
  const kind = CLASSIFIED_KINDS[item.kind]

  const photos = [item.imageId, item.image2Id].filter((id): id is string => id !== null)

  return (
    <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
      <article className="flex flex-col gap-8">
        <Link href="/annonces" className="inline-flex items-center gap-2 self-start text-sm link">
          <ArrowLeft aria-hidden className="size-4" /> Toutes les annonces
        </Link>
        <header className="flex flex-col gap-4">
          <Eyebrow>Annonce</Eyebrow>
          <p>
            <span className={cn('rounded-sm px-2 py-0.5 label-caps', kind.tone)}>{kind.label}</span>
          </p>
          <h1 className="text-h1">{item.title}</h1>
          <p className="text-sm text-ink-muted">
            Publiée le {formatDate(item.createdAt)} · supprimée automatiquement le{' '}
            {formatDate(classifiedExpiresAt(item.createdAt))}
          </p>
        </header>
        {photos.length > 0 ? (
          <div className={cn('grid gap-4', photos.length > 1 && 'sm:grid-cols-2')}>
            {photos.map((id, index) => (
              <FramedImage
                key={id}
                mediaId={id}
                eager={index === 0}
                className={cn('w-full rounded-lg', photos.length > 1 ? 'aspect-[4/3]' : 'aspect-[16/9]')}
              />
            ))}
          </div>
        ) : (
          <div className="brand-rule w-24" aria-hidden />
        )}
        <div className="flex flex-col gap-5 text-lead">
          {toParagraphs(item.description).map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
        <p className="text-sm text-ink-muted">{site.notices.classifiedLifetime}</p>
      </article>

      <aside className="self-start rounded-lg bg-surface p-6 shadow-raised lg:sticky lg:top-6">
        <InterestForm classifiedId={item.id} />
      </aside>
    </div>
  )
}
