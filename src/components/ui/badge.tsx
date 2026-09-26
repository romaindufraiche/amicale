import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'highlight'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-sunken text-ink',
  brand: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-success-50 text-success-800',
  warning: 'bg-warning-50 text-warning-800',
  danger: 'bg-danger-50 text-danger-700',
  highlight: 'bg-amber-300 text-ink',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-1 label-caps leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
