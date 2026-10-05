import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from '@/components/ui/button'
import { getSiteSettings } from '../queries'

type JoinLinkProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children?: ReactNode
}

/**
 * Bouton « Adhérer » : page HelloAsso d'adhésion renseignée par le bureau ou, à défaut,
 * page « Adhérer » du site.
 */
export async function JoinLink({ variant, size, className, children = 'Adhérer' }: JoinLinkProps) {
  const { membershipUrl } = await getSiteSettings()
  const classes = buttonClasses(variant, size, className)
  return membershipUrl ? (
    <a href={membershipUrl} rel="noopener noreferrer" className={classes}>
      {children}
    </a>
  ) : (
    <Link href="/adherer" className={classes}>
      {children}
    </Link>
  )
}
