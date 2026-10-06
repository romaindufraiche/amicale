import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { ChangePasswordForm } from '@/features/auth/components/password-forms'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Mon compte' }

const ROLE_LABELS = { ADMIN: 'Administrateur', BUREAU: 'Membre du bureau' } as const

export default async function AccountPage() {
  const user = await requirePermission('admin:access', '/admin/compte')
  const identity = [
    { label: 'Nom', value: `${user.firstName} ${user.lastName}` },
    { label: 'Adresse email', value: user.email },
    { label: 'Rôle', value: ROLE_LABELS[user.role] },
  ]

  return (
    <>
      <PageHeader eyebrow="Espace bureau" title="Mon compte" />
      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="identite" className="flex flex-col gap-5">
          <h2 id="identite" className="text-h3">
            Identité
          </h2>
          <dl className="divide-y divide-line border-y border-line">
            {identity.map((item) => (
              <div key={item.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                <dt className="text-ink-muted">{item.label}</dt>
                <dd className="font-semibold break-words">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="mot-de-passe" className="flex flex-col gap-5 rounded-md bg-surface p-6">
          <h2 id="mot-de-passe" className="text-h3">
            Changer de mot de passe
          </h2>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  )
}
