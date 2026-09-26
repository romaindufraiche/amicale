'use client'

import { Button, ButtonLink } from '@/components/ui/button'

/** Erreur inattendue pendant le rendu : message clair, sans détail technique, avec possibilité de réessayer. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="contenu" className="flex-1">
      <div className="mx-auto flex max-w-page flex-col items-start gap-6 px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-h1">Une erreur est survenue.</h1>
        <p className="max-w-prose text-lead text-ink-muted">
          La page n’a pas pu s’afficher. Réessayez dans quelques instants ; si le problème persiste, contactez
          le bureau
          {error.digest ? (
            <>
              {' '}
              en indiquant le code <span className="font-semibold text-ink tabular">{error.digest}</span>
            </>
          ) : null}
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={reset}>Réessayer</Button>
          <ButtonLink href="/" variant="secondary">
            Retour à l’accueil
          </ButtonLink>
        </div>
      </div>
    </main>
  )
}
