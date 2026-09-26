import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Surtitre : petite capitale précédée d'un trait rouge, repère de section. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center gap-2.5 label-caps text-red-700', className)}>
      <span aria-hidden className="h-0.5 w-6 bg-red-600" />
      {children}
    </p>
  )
}

type PageHeaderProps = {
  eyebrow?: string
  title: string
  lead?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, lead, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', className)}>
      <div className="flex max-w-prose flex-col gap-3">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="text-h1">{title}</h1>
        {lead ? <div className="text-lead text-ink-muted">{lead}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  )
}
