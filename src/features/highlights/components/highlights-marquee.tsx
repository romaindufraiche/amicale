'use client'

import { ArrowRight, Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { type CSSProperties, useId, useState } from 'react'
import { Eyebrow } from '@/components/ui/page-header'
import { mediaUrl } from '@/features/media/constants'
import { cn } from '@/lib/cn'
import { HIGHLIGHT_TONES } from '../labels'
import type { ActiveHighlight } from '../queries'

function HighlightCard({ item, hidden }: { item: ActiveHighlight; hidden: boolean }) {
  const external = item.linkUrl?.startsWith('https://')
  const label = item.linkLabel ?? 'En savoir plus'
  return (
    <article
      className={cn(
        'group relative flex h-full w-72 flex-col overflow-hidden rounded-md sm:w-96',
        HIGHLIGHT_TONES[item.tone].classes,
      )}
    >
      {item.imageId ? (
        // eslint-disable-next-line @next/next/no-img-element -- image déjà optimisée au téléversement
        <img
          src={mediaUrl(item.imageId)}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-h3 font-extrabold">{item.title}</h3>
        <p className="line-clamp-3">{item.body}</p>
        {item.linkUrl ? (
          external ? (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={hidden ? -1 : undefined}
              className="mt-auto inline-flex items-center gap-1.5 font-semibold underline-offset-4 group-hover:underline after:absolute after:inset-0"
            >
              {label} <ArrowRight aria-hidden className="size-4" />
              <span className="sr-only">(nouvel onglet)</span>
            </a>
          ) : (
            <Link
              href={item.linkUrl}
              tabIndex={hidden ? -1 : undefined}
              className="mt-auto inline-flex items-center gap-1.5 font-semibold underline-offset-4 group-hover:underline after:absolute after:inset-0"
            >
              {label} <ArrowRight aria-hidden className="size-4" />
            </Link>
          )
        ) : null}
      </div>
    </article>
  )
}

/**
 * Bandeau « À la une » : les posts défilent en continu de droite à gauche.
 * - pause au survol, au focus clavier et via un bouton (WCAG 2.2.2) ;
 * - sans animation si l'utilisateur a demandé à réduire les mouvements : la liste
 *   devient alors simplement défilable à la main ;
 * - la seconde copie du contenu, nécessaire à la boucle, est masquée aux lecteurs d'écran ;
 * - `fullBleed` : bandeau sur toute la largeur de l'écran, titre aligné sur la grille.
 */
export function HighlightsMarquee({
  items,
  fullBleed = false,
}: {
  items: ActiveHighlight[]
  fullBleed?: boolean
}) {
  const [paused, setPaused] = useState(false)
  const titleId = useId()
  if (items.length === 0) return null
  const animated = items.length > 1

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-5">
      <div
        className={cn(
          'flex items-center justify-between gap-4',
          fullBleed && 'mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8',
        )}
      >
        <Eyebrow>
          <span id={titleId}>À la une</span>
        </Eyebrow>
        {animated ? (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
            className="inline-flex min-h-10 items-center gap-2 rounded-sm px-3 text-sm font-semibold hover:bg-sunken motion-reduce:hidden"
          >
            {paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
            {paused ? 'Reprendre le défilement' : 'Mettre en pause'}
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          'group/marquee overflow-hidden',
          fullBleed ? 'px-0' : '-mx-4 px-4 sm:mx-0 sm:px-0',
          // Réduction des mouvements : pas d'animation, défilement manuel.
          'motion-reduce:overflow-x-auto',
        )}
      >
        <ul
          className={cn(
            'flex w-max',
            animated &&
              'animate-marquee group-focus-within/marquee:[animation-play-state:paused] group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none',
            paused && '[animation-play-state:paused]',
          )}
          style={animated ? ({ '--marquee-duration': `${items.length * 9}s` } as CSSProperties) : undefined}
        >
          {items.map((item) => (
            <li key={item.id} className="pr-5">
              <HighlightCard item={item} hidden={false} />
            </li>
          ))}
          {animated
            ? items.map((item) => (
                <li key={`copy-${item.id}`} aria-hidden className="pr-5 motion-reduce:hidden">
                  <HighlightCard item={item} hidden />
                </li>
              ))
            : null}
        </ul>
      </div>
    </section>
  )
}
