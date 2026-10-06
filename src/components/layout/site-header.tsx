import Link from 'next/link'
import { site } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
import { JoinLink } from '@/features/settings/components/join-link'
import { can } from '@/server/auth/permissions'
import { getCurrentSession } from '@/server/auth/session'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'
import { NavLink } from './nav-link'

const PUBLIC_NAV = [
  { href: '/offres', label: 'Offres' },
  { href: '/partenaires', label: 'Partenaires' },
  { href: '/adherer', label: 'Adhérer' },
  { href: '/actualites', label: 'Actualités' },
  { href: '/contact', label: 'Contact' },
] as const

export async function SiteHeader() {
  const session = await getCurrentSession()
  const isBureau = session ? can(session.user.role, 'admin:access') : false
  const actions = (
    <>
      {isBureau ? (
        <ButtonLink href="/admin" variant="ghost" size="sm">
          Espace bureau
        </ButtonLink>
      ) : null}
      <JoinLink size="sm">Adhérer en ligne</JoinLink>
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
