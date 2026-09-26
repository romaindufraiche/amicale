'use client'

import './globals.css'

/** Dernier recours si la mise en page racine elle-même échoue. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body className="grid min-h-dvh place-items-center p-6">
        <main className="flex max-w-prose flex-col gap-4">
          <h1 className="text-h2">Le site est momentanément indisponible.</h1>
          <p className="text-ink-muted">Réessayez dans quelques instants.</p>
          <button
            type="button"
            onClick={reset}
            className="self-start rounded-sm bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  )
}
