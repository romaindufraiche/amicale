import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { PageHeader } from '@/components/ui/page-header'

/** Gabarit des pages de compte : colonne centrée, largeur de formulaire. */
export function AuthShell({
  eyebrow,
  title,
  lead,
  width = 'narrow',
  children,
}: {
  eyebrow?: string
  title: string
  lead?: ReactNode
  width?: 'narrow' | 'prose'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto flex flex-col gap-10 px-4 py-14 sm:px-6 md:py-20',
        width === 'narrow' ? 'max-w-narrow' : 'max-w-prose',
      )}
    >
      <PageHeader eyebrow={eyebrow} title={title} lead={lead} />
      {children}
    </div>
  )
}
