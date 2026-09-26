import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/** Applique les migrations sur la base de test avant la suite. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgres://postgres@localhost:5432/amicale_test'
  const sql = postgres(url, { max: 1, onnotice: () => {} })
  await migrate(drizzle(sql), { migrationsFolder: 'drizzle' })
  await sql.end()
}
