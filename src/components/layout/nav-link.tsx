'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

/** Lien de navigation qui signale la page courante (aria-current) : soulignement rouge. */
export function NavLink({
  href,
  label,
  exact = false,
  className,
}: {
  href: string
  label: string
  exact?: boolean
  className?: string
}) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative inline-flex min-h-11 items-center font-display font-bold text-ink transition-colors hover:text-red-700',
        'after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:scale-x-0 after:bg-red-600 after:transition-transform',
        'hover:after:scale-x-100 aria-[current=page]:after:scale-x-100',
        className,
      )}
    >
      {label}
    </Link>
  )
}
