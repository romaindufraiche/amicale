import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { ChangePasswordForm } from '@/features/auth/components/password-forms'
import { MEMBER_CATEGORY_LABELS } from '@/features/members/categories'
import { ProfileForm } from '@/features/members/components/profile-form'
import { getOwnProfile } from '@/features/members/service'
import { formatDate } from '@/lib/dates'
import { requireUser } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function ProfilePage() {
  const user = await requireUser('/espace/profil')
  const profile = await getOwnProfile(user.id)
  if (!profile) notFound()

  const identity = [
    { label: 'Nom', value: `${profile.firstName} ${profile.lastName}` },
    { label: 'Adresse email', value: profile.email },
    { label: 'Situation', value: MEMBER_CATEGORY_LABELS[profile.category] },
    { label: 'Numéro d’adhérent', value: profile.memberNumber ?? 'Attribué à la validation' },
    {
      label: 'Fin de cotisation',
      value: profile.membershipValidUntil ? formatDate(profile.membershipValidUntil) : '—',
    },
    { label: 'Inscrit depuis le', value: formatDate(profile.createdAt) },
  ]

  return (
    <>
      <PageHeader eyebrow="Compte" title="Mon profil" />
      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="identite" className="flex flex-col gap-5">
          <h2 id="identite" className="text-h3">
            Informations d’adhésion
          </h2>
          <dl className="divide-y divide-line border-y border-line">
            {identity.map((item) => (
              <div key={item.label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
                <dt className="text-ink-muted">{item.label}</dt>
                <dd className="font-semibold break-words">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-ink-muted">
            Pour modifier votre nom, votre adresse email ou votre situation,{' '}
            <Link href="/contact" className="link">
              contactez le bureau
            </Link>
            .
          </p>
        </section>

        <div className="flex flex-col gap-10">
          <section aria-labelledby="coordonnees" className="flex flex-col gap-5 rounded-md bg-surface p-6">
            <h2 id="coordonnees" className="text-h3">
              Coordonnées
            </h2>
            <ProfileForm phone={profile.phone} assignment={profile.assignment} />
          </section>
          <section aria-labelledby="mot-de-passe" className="flex flex-col gap-5 rounded-md bg-surface p-6">
            <h2 id="mot-de-passe" className="text-h3">
              Mot de passe
            </h2>
            <ChangePasswordForm />
          </section>
        </div>
      </div>
    </>
  )
}
