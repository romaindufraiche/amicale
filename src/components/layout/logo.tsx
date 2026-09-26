import Image from 'next/image'
import { site } from '@/config/site'
import { cn } from '@/lib/cn'

/**
 * Logo ADPVO.
 * Le fichier officiel est utilisé dès qu'il est déclaré dans `site.logo`.
 * En attendant, le sigle est composé en texte dans les couleurs du logo
 * (noir « ADP », rouge « VO ») : c'est un repli provisoire, pas une recréation du logo.
 */
export function Logo({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  if (site.logo) {
    return (
      <Image
        src={site.logo.src}
        width={site.logo.width}
        height={site.logo.height}
        alt={site.legalName}
        priority
        className={cn('h-12 w-auto', className)}
      />
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
