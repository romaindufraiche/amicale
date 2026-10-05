import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsForm } from '@/features/settings/components/settings-form'
import { getSiteSettings } from '@/features/settings/queries'
import { requirePermission } from '@/server/auth/guards'
import { env } from '@/server/env'

export const metadata: Metadata = { title: 'Réglages' }

export default async function SettingsPage() {
  await requirePermission('settings:manage', '/admin/reglages')
  const settings = await getSiteSettings()
  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Réglages"
        lead="Lien d’adhésion et réception des commandes. Le lien de paiement facultatif de chaque offre se règle dans la fiche de l’offre."
      />
      <SettingsForm
        membershipUrl={settings.membershipUrl}
        ordersEmail={settings.ordersEmail}
        defaultOrdersEmail={env.BUREAU_EMAIL}
      />
    </>
  )
}
