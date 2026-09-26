import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { AppShell, type AppNavItem } from '@/components/layout/app-shell'
import { requireUser } from '@/server/auth/guards'
import { can } from '@/server/auth/permissions'

export const metadata: Metadata = {
  title: { default: 'Mon espace', template: '%s · Mon espace · ADPVO' },
  robots: { index: false, follow: false },
}

const MEMBER_NAV: AppNavItem[] = [
  { href: '/espace', label: 'Tableau de bord', exact: true },
  { href: '/espace/billetterie', label: 'Billetterie & sorties' },
  { href: '/espace/avantages', label: 'Avantages partenaires' },
  { href: '/espace/commandes', label: 'Mes commandes' },
  { href: '/espace/profil', label: 'Mon profil' },
]

const PENDING_NAV: AppNavItem[] = [
  { href: '/espace', label: 'Ma demande', exact: true },
  { href: '/espace/profil', label: 'Mon profil' },
]

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const user = await requireUser('/espace')
  const isActive = user.status === 'ACTIVE'
  return (
    <AppShell
      user={user}
      label="Espace adhérent"
      nav={isActive ? MEMBER_NAV : PENDING_NAV}
      aside={
        isActive && can(user.role, 'admin:access') ? (
          <ButtonLink href="/admin" variant="secondary" size="sm">
            Espace bureau
          </ButtonLink>
        ) : null
      }
    >
      {children}
    </AppShell>
  )
}
