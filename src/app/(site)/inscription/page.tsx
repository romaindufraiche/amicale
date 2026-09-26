import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { RegisterForm } from '@/features/auth/components/register-form'
import { getCurrentSession } from '@/server/auth/session'

export const metadata: Metadata = {
  title: 'Demande d’adhésion',
  description: 'Créez votre compte et transmettez votre demande d’adhésion au bureau de l’Amicale.',
  alternates: { canonical: '/inscription' },
}

export default async function RegisterPage() {
  if (await getCurrentSession()) redirect('/espace')
  return (
    <AuthShell
      eyebrow="Adhérer"
      title="Demande d’adhésion"
      width="prose"
      lead={
        <>
          Votre demande sera examinée par le bureau après confirmation de votre adresse email.{' '}
          <Link href="/adherer" className="link">
            Comment se passe l’adhésion ?
          </Link>
        </>
      }
    >
      <RegisterForm />
      <p className="text-ink-muted">
        Déjà inscrit ?{' '}
        <Link href="/connexion" className="font-semibold link">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  )
}
