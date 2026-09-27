/**
 * Adresse de la base selon l'hébergeur. `DATABASE_URL` reste la variable de référence ;
 * les intégrations Vercel ⇄ Neon/Postgres peuvent aussi fournir `POSTGRES_URL`.
 * Pour les migrations, on préfère une connexion directe (hors pool) si elle existe.
 */
export function resolveDatabaseUrl(
  source: Record<string, string | undefined>,
  purpose: 'app' | 'migration' = 'app',
): string | undefined {
  const candidates =
    purpose === 'migration'
      ? [
          source.DATABASE_URL_UNPOOLED,
          source.POSTGRES_URL_NON_POOLING,
          source.DATABASE_URL,
          source.POSTGRES_URL,
        ]
      : [source.DATABASE_URL, source.POSTGRES_URL]
  return candidates.find((value) => value && value.trim() !== '')
}

export const MISSING_DATABASE_URL =
  'Aucune base de données configurée (DATABASE_URL). En local : renseignez-la dans .env. ' +
  'Sur Vercel : Storage → connectez la base Neon au projet pour les environnements Production ET Preview, puis redéployez.'
