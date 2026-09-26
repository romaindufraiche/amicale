import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Tableau de données. Le conteneur défile horizontalement sur mobile
 * plutôt que de casser la mise en page ; la légende reste lisible par les lecteurs d'écran.
 */
export function Table({
  caption,
  children,
  className,
}: {
  caption: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-x-auto rounded-md border border-line bg-surface', className)}>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-line bg-sunken px-4 py-3 label-caps whitespace-nowrap text-ink-muted',
        className,
      )}
      {...props}
    />
  )
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('border-b border-line px-4 py-3 align-top', className)} {...props} />
}
