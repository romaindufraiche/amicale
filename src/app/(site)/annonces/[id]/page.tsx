import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { z } from 'zod'
import { Eyebrow } from '@/components/ui/page-header'
import { CLASSIFIED_KINDS } from '@/features/classifieds/labels'
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

  return (
    <article className="mx-auto flex max-w-prose flex-col gap-8 px-4 py-14 sm:px-6 md:py-20">
      <Link href="/annonces" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Toutes les annonces
      </Link>
      <header className="flex flex-col gap-4">
        <Eyebrow>Annonce</Eyebrow>
        <p>
          <span className={cn('rounded-sm px-2 py-0.5 label-caps', kind.tone)}>{kind.label}</span>
        </p>
        <h1 className="text-h1">{item.title}</h1>
        <p className="text-sm text-ink-muted">Publiée le {formatDate(item.createdAt)}</p>
      </header>
      {item.imageId ? (
        <FramedImage mediaId={item.imageId} eager className="aspect-[16/9] w-full rounded-lg" />
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
    </article>
  )
}
