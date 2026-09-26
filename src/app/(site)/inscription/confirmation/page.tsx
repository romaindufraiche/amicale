import type { Metadata } from 'next'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '@/features/auth/components/auth-shell'

export const metadata: Metadata = { title: 'Vérifiez votre messagerie', robots: { index: false } }

type Props = { searchParams: Promise<{ email?: string }> }

export default async function RegisterConfirmationPage({ searchParams }: Props) {
  const { email } = await searchParams
  const displayedEmail = typeof email === 'string' && email.length <= 254 ? email : null

  return (
    <AuthShell eyebrow="Demande d’adhésion" title="Vérifiez votre messagerie">
      <div className="flex flex-col gap-5">
        <MailCheck aria-hidden className="size-10 text-red-600" />
        <p className="text-lead">
          Un lien de confirmation vient d’être envoyé
          {displayedEmail ? (
            <>
              {' '}
              à <strong className="break-all">{displayedEmail}</strong>
            </>
          ) : null}
          .
        </p>
        <p className="text-ink-muted">
          Cliquez sur ce lien dans les 48 heures pour transmettre votre demande au bureau. Pensez à consulter
          vos courriers indésirables si vous ne le trouvez pas.
        </p>
      </div>
    </AuthShell>
  )
}
