import { Download, Smartphone } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buttonClasses } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { appleWalletConfig } from '@/features/member-cards/apple-wallet'
import { CardPreview } from '@/features/member-cards/components/card-preview'
import { googleWalletConfig } from '@/features/member-cards/google-wallet'
import { memberFromLink } from '@/features/member-cards/public'

export const metadata: Metadata = {
  title: 'Ma carte d’adhérent',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ token: string }> }

/** Page personnelle d'un adhérent : sa carte, en PDF ou dans le Wallet de son téléphone. */
export default async function MemberCardPage({ params }: Props) {
  const { token } = await params
  const member = await memberFromLink(token)
  if (!member) notFound()
  const base = `/carte/${token}`

  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader
        eyebrow="Adhérent"
        title="Votre carte d’adhérent"
        lead="Ajoutez-la à votre téléphone ou téléchargez-la en PDF. Ce lien vous est personnel : ne le partagez pas."
      />
      <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
        <CardPreview
          lastName={member.lastName}
          firstName={member.firstName}
          season={member.season}
          number={member.number}
        />
        <div className="max-w-md flex flex-col gap-3">
          {appleWalletConfig() ? (
            <a href={`${base}/apple`} className={buttonClasses('primary', 'md', 'justify-start')}>
              <Smartphone aria-hidden className="size-5" /> Ajouter à Apple Wallet (iPhone)
            </a>
          ) : null}
          {googleWalletConfig() ? (
            <a href={`${base}/google`} className={buttonClasses('primary', 'md', 'justify-start')}>
              <Smartphone aria-hidden className="size-5" /> Ajouter à Google Wallet (Android)
            </a>
          ) : null}
          <a href={`${base}/pdf`} className={buttonClasses('secondary', 'md', 'justify-start')}>
            <Download aria-hidden className="size-5" /> Télécharger la carte en PDF
          </a>
          <p className="text-sm text-ink-muted">
            Carte d’adhérent de l’Amicale : elle ne constitue ni une pièce d’identité ni une carte
            professionnelle.
          </p>
        </div>
      </div>
    </div>
  )
}
