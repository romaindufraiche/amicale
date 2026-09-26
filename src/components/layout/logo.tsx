import Image from 'next/image'
import { site } from '@/config/site'
import { cn } from '@/lib/cn'

/**
 * Logo ADPVO.
 * - Sur fond clair : fichier officiel. Il est fourni sur fond blanc (JPEG) ; `mix-blend-multiply`
 *   fond ce blanc dans le fond crème sans altérer les couleurs du logo.
 * - Sur fond sombre : aucune version adaptée n'a encore été fournie, le sigle est donc
 *   composé en texte dans les couleurs du logo (à remplacer par une version « négatif »).
 */
export function Logo({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  if (site.logo && tone === 'dark') {
    return (
      <span className={cn('inline-flex items-center gap-3', className)}>
        <Image
          src={site.logo.src}
          width={site.logo.width}
          height={site.logo.height}
          alt={site.legalName}
          priority
          sizes="(min-width: 640px) 130px, 110px"
          className="h-14 w-auto mix-blend-multiply sm:h-16"
        />
        {/* Le petit texte du logo n'est pas lisible à cette taille : le nom est répété en clair. */}
        <span aria-hidden className="hidden max-w-36 label-caps text-ink-muted xl:block">
          {site.legalName}
        </span>
      </span>
    )
  }

  return (
    <span className={cn('inline-flex flex-col leading-none', className)}>
      <span className="font-display text-h3 font-black tracking-tight" aria-hidden>
        <span className={tone === 'dark' ? 'text-ink' : 'text-white'}>ADP</span>
        <span className="text-red-500">VO</span>
      </span>
      <span className={cn('mt-1 label-caps', tone === 'dark' ? 'text-ink-muted' : 'text-line')}>
        {site.legalName}
      </span>
    </span>
  )
}
