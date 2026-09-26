import { LogOut } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { site } from '@/config/site'
import { logoutAction } from '@/features/auth/actions'
import type { SessionUser } from '@/server/auth/session'
import { Logo } from './logo'
import { NavLink } from './nav-link'

export type AppNavItem = { href: string; label: string; exact?: boolean }

/**
 * Gabarit des espaces connectés (adhérent et bureau) : en-tête compact,
 * navigation en onglets défilante sur mobile, contenu centré.
 */
export function AppShell({
  user,
  label,
  nav,
  aside,
  children,
}: {
  user: SessionUser
  label: string
  nav: readonly AppNavItem[]
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <header className="bg-paper">
        <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-4 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0 rounded-sm" aria-label={`${site.legalName} — accueil du site`}>
              <Logo />
            </Link>
            <span className="hidden rounded-sm bg-ink px-2 py-1 label-caps text-white sm:inline">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {aside}
            <p className="hidden text-right text-sm leading-tight md:block">
              <span className="block font-semibold">
                {user.firstName} {user.lastName}
              </span>
              {user.memberNumber ? (
                <span className="text-ink-muted tabular">N° {user.memberNumber}</span>
              ) : null}
            </p>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm font-semibold text-ink hover:bg-sunken"
              >
                <LogOut aria-hidden className="size-4" />
                <span>Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
        <nav
          aria-label={`Navigation ${label.toLowerCase()}`}
          className="mx-auto max-w-page px-4 sm:px-6 lg:px-8"
        >
          <ul className="-mb-px flex [scrollbar-width:none] gap-6 overflow-x-auto pt-3">
            {nav.map((item) => (
              <li key={item.href} className="shrink-0">
                <NavLink href={item.href} label={item.label} exact={item.exact} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="brand-rule" aria-hidden />
      </header>
      <main id="contenu" tabIndex={-1} className="flex-1 focus:outline-none">
        <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="border-t border-line">
        <p className="mx-auto flex max-w-page flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-caption text-ink-muted sm:px-6 lg:px-8">
          <span>
            © {new Date().getFullYear()} {site.legalName}
          </span>
          <Link href="/contact" className="hover:underline">
            Contacter le bureau
          </Link>
          <Link href="/confidentialite" className="hover:underline">
            Données personnelles
          </Link>
          <Link href="/mentions-legales" className="hover:underline">
            Mentions légales
          </Link>
        </p>
      </footer>
    </>
  )
}
