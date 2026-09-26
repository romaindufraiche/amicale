import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import postgres from 'postgres'

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://postgres@localhost:5432/amicale_e2e'

/** Base e2e dédiée : vidée, puis remplie avec le jeu de démonstration. Boîte d'envoi vidée. */
export default async function globalSetup() {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL,
    NODE_ENV: 'test',
    APP_URL: 'http://localhost:3100',
    MAIL_TRANSPORT: 'outbox',
    MAIL_FROM: 'ADPVO <no-reply@example.org>',
    BUREAU_EMAIL: 'bureau@example.org',
  }
  execSync('pnpm -s db:migrate', { env, stdio: 'inherit' })
  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} })
  await sql`truncate users restart identity cascade`
  await sql.end()
  execSync('pnpm -s db:seed:demo', { env, stdio: 'inherit' })
  rmSync('.outbox', { recursive: true, force: true })
}
