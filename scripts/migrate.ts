/**
 * Applique les migrations SQL du dossier `drizzle/` (idempotent : les migrations
 * déjà appliquées sont ignorées). À exécuter avant chaque démarrage d'une nouvelle version.
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { MISSING_DATABASE_URL, resolveDatabaseUrl } from '../src/lib/database-url'

async function main() {
  const url = resolveDatabaseUrl(process.env, 'migration')
  if (!url) throw new Error(MISSING_DATABASE_URL)
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
  try {
    await migrate(drizzle(sql), { migrationsFolder: 'drizzle' })
    console.log('Migrations appliquées.')
  } finally {
    await sql.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
