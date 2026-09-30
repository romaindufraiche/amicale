import Link from 'next/link'
import { site } from '@/config/site'
import { getCurrentSession } from '@/server/auth/session'
import { ButtonLink } from '@/components/ui/button'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'
import { NavLink } from './nav-link'

const PUBLIC_NAV = [
  { href: '/adherer', label: 'Adhérer' },
  { href: '/actualites', label: 'Actualités' },
  { href: '/contact', label: 'Contact' },
] as const

export async function SiteHeader() {
  const session = await getCurrentSession()
  const actions = session ? (
    <ButtonLink href="/espace" size="sm">
      Mon espace
    </ButtonLink>
  ) : (
    <>
      <ButtonLink href="/connexion" variant="ghost" size="sm">
        Se connecter
      </ButtonLink>
      <ButtonLink href="/inscription" size="sm">
        Devenir adhérent
      </ButtonLink>
    </>
  )

  return (
    <header className="relative z-30 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-page items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 rounded-sm" aria-label={`${site.legalName} — accueil`}>
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">{actions}</div>
        <MobileMenu items={PUBLIC_NAV} footer={actions} />
      </div>
    </header>
  )
}
