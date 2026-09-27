import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { site } from '@/config/site'
import { Alert } from '@/components/ui/alert'
import { ButtonLink } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/page-header'
import { mediaUrl } from '@/features/media/constants'
import { getPublishedNews } from '@/features/news/queries'
import { formatDate } from '@/lib/dates'
import { toParagraphs } from '@/lib/text'
import { getCurrentSession } from '@/server/auth/session'

type Props = { params: Promise<{ slug: string }> }

const loadNews = cache((slug: string) => getPublishedNews(slug))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await loadNews((await params).slug)
  if (!item) return { title: 'Actualité introuvable' }
  const isPublic = item.visibility === 'PUBLIC'
  return {
    title: item.title,
    description: isPublic ? item.excerpt : undefined,
    alternates: { canonical: `/actualites/${item.slug}` },
    robots: isPublic ? undefined : { index: false },
    openGraph: isPublic
      ? {
          type: 'article',
          title: item.title,
          description: item.excerpt,
          images: item.imageId ? [mediaUrl(item.imageId)] : undefined,
        }
      : undefined,
  }
}

export default async function NewsPage({ params }: Props) {
  const item = await loadNews((await params).slug)
  if (!item) notFound()

  const session = await getCurrentSession()
  const canRead = item.visibility === 'PUBLIC' || session?.user.status === 'ACTIVE'

  const structuredData =
    item.visibility === 'PUBLIC'
      ? {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: item.title,
          description: item.excerpt,
          datePublished: item.publishedAt?.toISOString(),
          dateModified: item.updatedAt.toISOString(),
          publisher: { '@type': 'Organization', name: site.legalName },
        }
      : null

  return (
    <article className="mx-auto flex max-w-prose flex-col gap-8 px-4 py-14 sm:px-6 md:py-20">
      {structuredData ? (
        <script
          type="application/ld+json"
          // JSON sérialisé côté serveur ; « < » est échappé pour empêcher toute sortie de balise.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />
      ) : null}
      <Link href="/actualites" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Toutes les actualités
      </Link>
      <header className="flex flex-col gap-4">
        {item.publishedAt ? (
          <Eyebrow>
            <time dateTime={item.publishedAt.toISOString()}>{formatDate(item.publishedAt)}</time>
          </Eyebrow>
        ) : null}
        <h1 className="text-h1">{item.title}</h1>
        <p className="text-lead text-ink-muted">{item.excerpt}</p>
      </header>
      {item.imageId ? (
        // eslint-disable-next-line @next/next/no-img-element -- image déjà optimisée au téléversement
        <img src={mediaUrl(item.imageId)} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" />
      ) : (
        <div className="brand-rule w-24" aria-hidden />
      )}
      {canRead ? (
        <div className="flex flex-col gap-5">
          {toParagraphs(item.body).map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Alert tone="info" title="Cette actualité est réservée aux adhérents.">
            Connectez-vous avec un compte adhérent pour la lire en entier.
          </Alert>
          <ButtonLink href={`/connexion?next=/actualites/${item.slug}`} className="self-start">
            Se connecter
          </ButtonLink>
        </div>
      )}
    </article>
  )
}
