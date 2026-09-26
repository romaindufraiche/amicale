import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { AppShell, type AppNavItem } from '@/components/layout/app-shell'
import { requirePermission } from '@/server/auth/guards'
import { can } from '@/server/auth/permissions'

export const metadata: Metadata = {
  title: { default: 'Espace bureau', template: '%s · Bureau · ADPVO' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requirePermission('admin:access', '/admin')
  const nav: AppNavItem[] = [
    { href: '/admin', label: 'Vue d’ensemble', exact: true },
    { href: '/admin/adherents', label: 'Adhérents' },
    { href: '/admin/commandes', label: 'Commandes' },
    { href: '/admin/offres', label: 'Offres' },
    { href: '/admin/actualites', label: 'Actualités' },
    { href: '/admin/partenaires', label: 'Partenaires' },
    { href: '/admin/messages', label: 'Messages' },
    ...(can(user.role, 'audit:read') ? [{ href: '/admin/journal', label: 'Journal' }] : []),
  ]
  return (
    <AppShell
      user={user}
      label="Espace bureau"
      nav={nav}
      aside={
        <ButtonLink href="/espace" variant="ghost" size="sm" className="hidden sm:inline-flex">
          Espace adhérent
        </ButtonLink>
      }
    >
      {children}
    </AppShell>
  )
}
