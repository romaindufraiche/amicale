import { Pin } from 'lucide-react'
import Link from 'next/link'
import { FramedImage } from '@/features/media/components/framed-image'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/dates'
import type { Classified } from '@/server/db/schema'
import { CLASSIFIED_KINDS } from '../labels'

/** Carte d'une annonce dans la rubrique : type, titre, début de la description. */
export function ClassifiedCard({ item }: { item: Classified }) {
  const kind = CLASSIFIED_KINDS[item.kind]
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-md bg-surface shadow-raised transition-shadow hover:shadow-overlay',
        item.pinned && 'ring-2 ring-rose-600',
      )}
    >
      {item.imageId ? <FramedImage mediaId={item.imageId} className="aspect-[16/10] w-full" /> : null}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="flex flex-wrap items-center gap-2">
          <span className={cn('rounded-sm px-2 py-0.5 label-caps', kind.tone)}>{kind.label}</span>
          {item.pinned ? (
            <span className="inline-flex items-center gap-1 label-caps text-rose-700">
              <Pin aria-hidden className="size-3.5" /> Épinglée
            </span>
          ) : null}
        </p>
        <h2 className="font-display text-h3 font-extrabold">
          <Link
            href={`/annonces/${item.id}`}
            className="group-hover:text-blue-600 after:absolute after:inset-0"
          >
            {item.title}
          </Link>
        </h2>
        <p className="line-clamp-3 whitespace-pre-line text-ink-muted">{item.description}</p>
        <p className="mt-auto pt-2 text-sm text-ink-muted">Publiée le {formatDate(item.createdAt)}</p>
      </div>
    </article>
  )
}
