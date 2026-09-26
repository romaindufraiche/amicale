'use client'

import { useActionState, type ReactNode } from 'react'
import type { FormState } from '@/lib/form-state'
import { idleState } from '@/lib/form-state'
import { cn } from '@/lib/cn'
import type { ButtonSize, ButtonVariant } from './button'
import { FormMessage } from './form-message'
import { SubmitButton } from './submit-button'

type ActionFormProps = {
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  fields: Record<string, string>
  label: string
  pendingLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  /** Demande de confirmation avant les actions destructrices ou irréversibles. */
  confirm?: string
  children?: ReactNode
  className?: string
}

/** Bouton d'action isolé (valider, publier, annuler…) avec retour d'état. */
export function ActionForm({
  action,
  fields,
  label,
  pendingLabel,
  variant = 'secondary',
  size = 'sm',
  confirm,
  children,
  className,
}: ActionFormProps) {
  const [state, formAction] = useActionState(action, idleState)
  return (
    <form
      action={formAction}
      className={cn('flex flex-col gap-3', className)}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault()
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <SubmitButton variant={variant} size={size} pendingLabel={pendingLabel} className="self-start">
        {label}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  )
}
