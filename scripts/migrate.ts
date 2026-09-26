/**
 * Applique les migrations SQL du dossier `drizzle/` (idempotent : les migrations
 * déjà appliquées sont ignorées). À exécuter avant chaque démarrage d'une nouvelle version.
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL est requis.')
  const sql = postgres(url, { max: 1, onnotice: () => {} })
  try {
    await migrate(drizzle(sql), { migrationsFolder: 'drizzle' })
    console.log('Migrations appliquées.')
  } finally {
    await sql.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
