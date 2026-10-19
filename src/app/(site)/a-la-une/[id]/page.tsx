import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { z } from 'zod'
import { buttonClasses } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/page-header'
import { getActiveHighlight } from '@/features/highlights/queries'
import { toParagraphs } from '@/lib/text'
import { FramedImage } from '@/features/media/components/framed-image'

type Props = { params: Promise<{ id: string }> }

const loadHighlight = cache(async (id: string) => {
  const parsed = z.uuid().safeParse(id)
  return parsed.success ? getActiveHighlight(parsed.data) : null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await loadHighlight((await params).id)
  return item ? { title: item.title, description: item.body } : { title: 'Post introuvable' }
}

/** Page d'un post « À la une » : texte complet, photo et lien éventuel. */
export default async function HighlightPage({ params }: Props) {
  const item = await loadHighlight((await params).id)
  if (!item) notFound()
  const external = item.linkUrl?.startsWith('https://')

  return (
    <article className="mx-auto flex max-w-prose flex-col gap-8 px-4 py-14 sm:px-6 md:py-20">
      <Link href="/" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Retour à l’accueil
      </Link>
      <header className="flex flex-col gap-4">
        <Eyebrow>À la une</Eyebrow>
        <h1 className="text-h1">{item.title}</h1>
      </header>
      {item.imageId ? (
        <FramedImage mediaId={item.imageId} eager className="aspect-[16/9] w-full rounded-lg" />
      ) : (
        <div className="brand-rule w-24" aria-hidden />
      )}
      <div className="flex flex-col gap-5 text-lead">
        {toParagraphs(item.body).map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
      {item.linkUrl ? (
        external ? (
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('primary', 'md', 'self-start')}
          >
            {item.linkLabel ?? 'En savoir plus'} <ExternalLink aria-hidden className="size-4" />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        ) : (
          <Link href={item.linkUrl} className={buttonClasses('primary', 'md', 'self-start')}>
            {item.linkLabel ?? 'En savoir plus'} <ArrowRight aria-hidden className="size-4" />
          </Link>
        )
      ) : null}
    </article>
  )
}
