'use client'

import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button'

type SubmitButtonProps = {
  children: ReactNode
  /** Libellé affiché pendant l'envoi, ex. « Envoi en cours… ». */
  pendingLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  name?: string
  value?: string
}

/**
 * Bouton de soumission : désactivé pendant l'envoi pour éviter les doubles clics,
 * et annonce l'état aux technologies d'assistance.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant,
  size,
  className,
  name,
  value,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending || undefined}
      className={buttonClasses(variant, size, className)}
    >
      {pending ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}
