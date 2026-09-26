import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<AlertTone, { classes: string; Icon: typeof Info }> = {
  info: { classes: 'border-blue-500 bg-blue-50 text-ink', Icon: Info },
  success: { classes: 'border-success-800 bg-success-50 text-success-800', Icon: CircleCheck },
  warning: { classes: 'border-warning-800 bg-warning-50 text-warning-800', Icon: TriangleAlert },
  danger: { classes: 'border-danger-700 bg-danger-50 text-danger-700', Icon: CircleAlert },
}

type AlertProps = {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  className?: string
  /** `alert` interrompt le lecteur d'écran : à réserver aux erreurs consécutives à une action. */
  role?: 'status' | 'alert'
}

export function Alert({ tone = 'info', title, children, className, role = 'status' }: AlertProps) {
  const { classes, Icon } = tones[tone]
  return (
    <div role={role} className={cn('flex gap-3 rounded-sm border-l-4 px-4 py-3.5', classes, className)}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1 text-sm">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className="text-ink [&_a]:link">{children}</div> : null}
      </div>
    </div>
  )
}
