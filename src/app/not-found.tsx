import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/button'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

export const metadata: Metadata = { title: 'Page introuvable', robots: { index: false } }

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" tabIndex={-1} className="flex-1 focus:outline-none">
        <div className="mx-auto flex max-w-page flex-col items-start gap-6 px-4 py-20 sm:px-6 lg:px-8">
          <p aria-hidden className="font-display text-display font-black text-red-500 tabular">
            404
          </p>
          <h1 className="text-h1">Cette page n’existe pas.</h1>
          <p className="max-w-prose text-lead text-ink-muted">
            Le lien est peut-être incorrect, ou le contenu a été retiré. Si vous cherchiez une offre ou une
            commande, retrouvez-la depuis votre espace.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/">Retour à l’accueil</ButtonLink>
            <ButtonLink href="/espace" variant="secondary">
              Mon espace
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
