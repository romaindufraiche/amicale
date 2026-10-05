import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { ForgotPasswordForm } from '@/features/auth/components/password-forms'

export const metadata: Metadata = { title: 'Mot de passe oublié', robots: { index: false } }

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Espace bureau"
      title="Mot de passe oublié"
      lead="Indiquez l’adresse email de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe."
    >
      <ForgotPasswordForm />
      <Link href="/connexion" className="self-start link">
        Retour à la connexion
      </Link>
    </AuthShell>
  )
}
