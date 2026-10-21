import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { VisitBeacon } from '@/features/visits/components/visit-beacon'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="contenu" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppButton />
      <VisitBeacon />
    </>
  )
}
