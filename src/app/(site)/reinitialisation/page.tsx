import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { ButtonLink } from '@/components/ui/button'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { ResetPasswordForm } from '@/features/auth/components/password-forms'
import { isResetTokenValid } from '@/features/auth/service'

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false },
  // Le jeton figure dans l'URL : il ne doit pas fuiter vers d'autres sites.
  referrer: 'no-referrer',
}

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  const valid = typeof token === 'string' && (await isResetTokenValid(token))

  return (
    <AuthShell eyebrow="Espace adhérent" title="Nouveau mot de passe">
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <Alert tone="warning" title="Ce lien a expiré ou a déjà été utilisé.">
            Les liens de réinitialisation sont valables une heure et ne servent qu’une fois.
          </Alert>
          <ButtonLink href="/mot-de-passe-oublie" className="self-start">
            Faire une nouvelle demande
          </ButtonLink>
        </>
      )}
    </AuthShell>
  )
}
