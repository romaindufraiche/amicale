import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { LoginForm } from '@/features/auth/components/login-form'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { getCurrentSession } from '@/server/auth/session'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre espace adhérent.',
  robots: { index: false },
}

type Props = { searchParams: Promise<{ next?: string; reinitialise?: string; verifie?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const next = safeRedirectPath(params.next)
  if (await getCurrentSession()) redirect(next)

  return (
    <AuthShell eyebrow="Espace adhérent" title="Connexion">
      {params.reinitialise ? (
        <Alert tone="success" title="Mot de passe modifié">
          Vous pouvez vous connecter avec votre nouveau mot de passe.
        </Alert>
      ) : null}
      <LoginForm next={next} />
      <p className="border-t border-line pt-6 text-ink-muted">
        Pas encore adhérent ?{' '}
        <Link href="/inscription" className="font-semibold link">
          Faire une demande d’adhésion
        </Link>
      </p>
    </AuthShell>
  )
}
