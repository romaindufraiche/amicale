import type { Metadata } from 'next'
import { Alert } from '@/components/ui/alert'
import { ButtonLink } from '@/components/ui/button'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { verifyEmail } from '@/features/auth/service'

export const metadata: Metadata = { title: 'Confirmation de l’adresse email', robots: { index: false } }

type Props = { searchParams: Promise<{ token?: string }> }

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams
  const result = typeof token === 'string' ? await verifyEmail(token) : 'INVALID'

  if (result === 'VERIFIED') {
    return (
      <AuthShell eyebrow="Demande d’adhésion" title="Adresse confirmée">
        <Alert tone="success" title="Votre demande a été transmise au bureau.">
          Vous recevrez un email dès que votre adhésion aura été validée. Vous pouvez déjà vous connecter pour
          suivre l’avancement de votre demande.
        </Alert>
        <ButtonLink href="/connexion" className="self-start">
          Se connecter
        </ButtonLink>
      </AuthShell>
    )
  }

  return (
    <AuthShell eyebrow="Demande d’adhésion" title="Lien invalide ou expiré">
      <Alert tone="warning" title="Ce lien de confirmation ne peut pas être utilisé.">
        Il a peut-être déjà servi ou dépassé sa durée de validité de 48 heures. Connectez-vous avec votre
        adresse email et votre mot de passe : si votre adresse n’est pas encore confirmée, un nouveau lien
        vous sera envoyé.
      </Alert>
      <ButtonLink href="/connexion" className="self-start">
        Se connecter
      </ButtonLink>
    </AuthShell>
  )
}
