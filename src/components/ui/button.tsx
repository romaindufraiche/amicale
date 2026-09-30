import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'outlineInverse' | 'danger'
export type ButtonSize = 'md' | 'sm'

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-display font-bold whitespace-nowrap transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'border border-ink bg-surface text-ink hover:bg-sunken active:bg-line',
  ghost: 'text-ink hover:bg-sunken active:bg-line',
  inverse: 'bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100',
  /** Contour blanc, pour les fonds de couleur. */
  outlineInverse: 'border border-white text-white hover:bg-white/10 active:bg-white/20',
  danger: 'border border-danger-700 bg-surface text-danger-700 hover:bg-danger-50',
}

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-12 px-5 text-base',
  sm: 'min-h-10 px-4 text-sm',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />
}
