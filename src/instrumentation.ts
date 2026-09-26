import type { Instrumentation } from 'next'

/**
 * Point d'accroche unique des erreurs serveur non gérées : journalisées en JSON avec
 * la route et l'identifiant de requête. C'est ici que brancher un service de suivi
 * d'erreurs (Sentry, etc.) — voir docs/EXPLOITATION.md.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const err = error instanceof Error ? error : new Error(String(error))
  const headers = request.headers as Record<string, string | string[] | undefined>
  // Sortie d'erreur standard, compatible avec les deux runtimes (Node.js et Edge).
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      time: new Date().toISOString(),
      level: 'error',
      message: 'request.unhandled_error',
      // La query string peut contenir un jeton (vérification, réinitialisation) : jamais journalisée.
      path: request.path.split('?')[0],
      method: request.method,
      requestId: headers['x-request-id'] ?? null,
      routePath: context.routePath,
      routeType: context.routeType,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        digest: (err as { digest?: string }).digest,
      },
    }),
  )
}
