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
  description: 'Connexion à l’espace bureau de l’Amicale.',
  robots: { index: false },
}

type Props = { searchParams: Promise<{ next?: string; reinitialise?: string; verifie?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const next = params.next ? safeRedirectPath(params.next) : undefined
  const session = await getCurrentSession()
  if (session) redirect(next ?? '/admin')

  return (
    <AuthShell eyebrow="Espace bureau" title="Connexion">
      {params.reinitialise ? (
        <Alert tone="success" title="Mot de passe modifié">
          Vous pouvez vous connecter avec votre nouveau mot de passe.
        </Alert>
      ) : null}
      <LoginForm next={next} />
      <p className="border-t border-line pt-6 text-ink-muted">
        Cet espace est réservé aux membres du bureau. Pour adhérer à l’Amicale,{' '}
        <Link href="/adherer" className="font-semibold link">
          suivez ce lien
        </Link>
        .
      </p>
    </AuthShell>
  )
}
