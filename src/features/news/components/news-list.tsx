import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { mediaUrl } from '@/features/media/constants'
import { formatDate } from '@/lib/dates'

type NewsItem = {
  id: string
  slug: string
  title: string
  excerpt: string
  visibility: 'PUBLIC' | 'MEMBERS'
  imageId: string | null
  publishedAt: Date | null
}

/** Liste éditoriale : date en marge, titre, chapô et photo éventuelle — séparés par des filets, sans cartes. */
export function NewsList({ items, headingLevel = 'h2' }: { items: NewsItem[]; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel
  return (
    <ol className="border-t border-line">
      {items.map((item) => (
        <li
          key={item.id}
          className="group relative grid gap-2 border-b border-line py-7 md:grid-cols-[10rem_1fr_auto] md:gap-8"
        >
          <p className="pt-1 label-caps text-ink-muted">
            {item.publishedAt ? (
              <time dateTime={item.publishedAt.toISOString()}>{formatDate(item.publishedAt)}</time>
            ) : null}
          </p>
          <div className="flex max-w-prose flex-col gap-2">
            {item.visibility === 'MEMBERS' ? (
              <Badge tone="brand" className="self-start">
                Réservé aux adhérents
              </Badge>
            ) : null}
            <Heading className="font-display text-h3 font-extrabold">
              <Link
                href={`/actualites/${item.slug}`}
                className="group-hover:text-blue-600 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 after:absolute after:inset-0"
              >
                {item.title}
              </Link>
            </Heading>
            <p className="text-ink-muted">{item.excerpt}</p>
          </div>
          {item.imageId ? (
            // eslint-disable-next-line @next/next/no-img-element -- image déjà optimisée au téléversement
            <img
              src={mediaUrl(item.imageId)}
              alt=""
              loading="lazy"
              className="order-first aspect-[16/9] w-full rounded-md object-cover md:order-none md:w-64"
            />
          ) : null}
        </li>
      ))}
    </ol>
  )
}
