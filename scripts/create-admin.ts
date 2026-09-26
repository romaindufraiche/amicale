/**
 * Crée (ou promeut) le premier compte administrateur.
 *
 *   pnpm admin:create --email bureau@exemple.fr --first-name Prénom --last-name Nom
 *
 * Le mot de passe est demandé de manière interactive (jamais en argument, pour ne pas
 * finir dans l'historique du shell). Sans terminal, il est lu dans ADMIN_PASSWORD.
 */
import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { eq, sql } from 'drizzle-orm'
import { emailField, PASSWORD_MIN } from '@/features/auth/schemas'
import { defaultMembershipEnd, formatMemberNumber } from '@/features/members/membership'
import { parisDay } from '@/lib/dates'
import { hashPassword } from '@/server/auth/password'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD
  if (!process.stdin.isTTY)
    throw new Error('Mot de passe requis : terminal interactif ou variable ADMIN_PASSWORD.')
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  // Masque la saisie : readline n'expose pas d'option publique pour cela.
  const writable = rl as unknown as { _writeToOutput: (text: string) => void }
  let muted = false
  writable._writeToOutput = (text) => {
    if (!muted) process.stdout.write(text)
  }
  const question = rl.question(`Mot de passe (${PASSWORD_MIN} caractères minimum) : `)
  muted = true
  const password = await question
  rl.close()
  process.stdout.write('\n')
  return password
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      'first-name': { type: 'string' },
      'last-name': { type: 'string' },
    },
  })
  const email = emailField.parse(values.email ?? '')
  const firstName = values['first-name']?.trim()
  const lastName = values['last-name']?.trim()
  if (!firstName || !lastName) throw new Error('--first-name et --last-name sont requis.')

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    await db.update(users).set({ role: 'ADMIN', status: 'ACTIVE' }).where(eq(users.id, existing.id))
    console.log(`Compte existant ${email} promu administrateur.`)
    return
  }

  const password = await readPassword()
  if (password.length < PASSWORD_MIN)
    throw new Error(`Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`)

  const [seq] = await db.execute<{ value: number }>(sql`select nextval('member_number_seq')::int as value`)
  const today = parisDay()
  await db.insert(users).values({
    email,
    passwordHash: await hashPassword(password),
    firstName,
    lastName,
    category: 'ACTIF',
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerifiedAt: new Date(),
    memberNumber: formatMemberNumber(new Date().getFullYear(), seq?.value ?? 1),
    membershipValidUntil: defaultMembershipEnd(today),
  })
  console.log(`Administrateur ${email} créé.`)
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
