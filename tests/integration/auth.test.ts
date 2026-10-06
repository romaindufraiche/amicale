import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { authenticate, changePassword, requestPasswordReset, resetPassword } from '@/features/auth/service'
import { hashToken } from '@/server/auth/crypto'
import { hashPassword } from '@/server/auth/password'
import { db } from '@/server/db/client'
import { type users, userTokens } from '@/server/db/schema'
import { consumeRateLimit } from '@/server/rate-limit'
import { createBureauUser, resetDatabase } from '../support/db'

const EMAIL = 'tresorier@example.fr'
const PASSWORD = 'une phrase de passe solide'

async function createAccount(overrides: Partial<typeof users.$inferInsert> = {}) {
  return createBureauUser({ email: EMAIL, passwordHash: await hashPassword(PASSWORD), ...overrides })
}

/** Remplace le jeton par un jeton connu : seule son empreinte est stockée en base. */
async function knownToken(userId: string, token: string) {
  await db
    .update(userTokens)
    .set({ id: hashToken(token) })
    .where(eq(userTokens.userId, userId))
}

describe('connexion du bureau', () => {
  beforeEach(resetDatabase)

  it('accepte le bon mot de passe et renvoie le rôle', async () => {
    const user = await createAccount({ role: 'ADMIN' })
    expect(await authenticate(EMAIL, PASSWORD, 'ip-1')).toEqual({ ok: true, userId: user.id, role: 'ADMIN' })
  })

  it('répond de la même façon pour un compte inconnu et un mauvais mot de passe', async () => {
    await createAccount()
    expect(await authenticate('inconnu@example.fr', 'peu importe', 'ip-1')).toEqual({
      ok: false,
      reason: 'INVALID_CREDENTIALS',
    })
    expect(await authenticate(EMAIL, 'mauvais mot de passe', 'ip-1')).toEqual({
      ok: false,
      reason: 'INVALID_CREDENTIALS',
    })
  })

  it('bloque après 5 échecs sur une même adresse, même avec le bon mot de passe', async () => {
    await createAccount()
    for (let attempt = 0; attempt < 5; attempt += 1) await authenticate(EMAIL, 'mauvais', 'ip-1')
    expect(await authenticate(EMAIL, PASSWORD, 'ip-1')).toMatchObject({ ok: false, reason: 'RATE_LIMITED' })
  })

  it('refuse un compte désactivé', async () => {
    await createAccount({ status: 'SUSPENDED' })
    expect(await authenticate(EMAIL, PASSWORD, 'ip-1')).toEqual({ ok: false, reason: 'SUSPENDED' })
  })
})

describe('mot de passe', () => {
  beforeEach(resetDatabase)

  it('le lien de réinitialisation ne sert qu’une fois et remplace le mot de passe', async () => {
    const user = await createAccount()
    expect(await requestPasswordReset(EMAIL, 'ip-1')).toEqual({ ok: true })
    const token = 'y'.repeat(43)
    await knownToken(user.id, token)

    expect(await resetPassword(token, 'nouvelle phrase de passe')).toBe(true)
    expect(await resetPassword(token, 'encore une autre phrase')).toBe(false)
    expect(await authenticate(EMAIL, 'nouvelle phrase de passe', 'ip-2')).toMatchObject({ ok: true })
  })

  it('répond pareil pour une adresse inconnue', async () => {
    expect(await requestPasswordReset('inconnu@example.fr', 'ip-1')).toEqual({ ok: true })
    expect(await db.select().from(userTokens)).toHaveLength(0)
  })

  it('change le mot de passe seulement avec le mot de passe actuel', async () => {
    const user = await createAccount()
    expect(await changePassword(user.id, 'session-inconnue', 'mauvais', 'nouvelle phrase de passe')).toBe(
      false,
    )
    expect(await changePassword(user.id, 'session-inconnue', PASSWORD, 'nouvelle phrase de passe')).toBe(true)
    expect(await authenticate(EMAIL, 'nouvelle phrase de passe', 'ip-3')).toMatchObject({ ok: true })
  })
})

describe('limitation de débit', () => {
  beforeEach(resetDatabase)

  it('compte les tentatives de manière atomique', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => consumeRateLimit('test:key', 4, 60_000)),
    )
    expect(results.filter((result) => result.allowed)).toHaveLength(4)
  })
})
