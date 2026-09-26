import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  authenticate,
  registerMember,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from '@/features/auth/service'
import { approveMember, changeMemberRole } from '@/features/members/service'
import { hashToken } from '@/server/auth/crypto'
import { db } from '@/server/db/client'
import { users, userTokens } from '@/server/db/schema'
import { consumeRateLimit } from '@/server/rate-limit'
import { createMember, resetDatabase } from '../support/db'

const input = {
  firstName: 'Alex',
  lastName: 'Exemple',
  email: 'alex@example.fr',
  phone: null,
  category: 'ACTIF' as const,
  assignment: null,
  password: 'une phrase de passe solide',
  passwordConfirm: 'une phrase de passe solide',
  certify: 'on' as const,
}

/** Remplace le jeton par un jeton connu : seule son empreinte est stockée en base. */
async function knownToken(userId: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET', token: string) {
  await db
    .update(userTokens)
    .set({ id: hashToken(token) })
    .where(eq(userTokens.userId, userId))
  const [row] = await db.select().from(userTokens).where(eq(userTokens.userId, userId))
  expect(row?.purpose).toBe(purpose)
}

describe('parcours d’adhésion', () => {
  beforeEach(resetDatabase)

  it('inscription → vérification → validation par le bureau', async () => {
    expect(await registerMember(input, 'ip-1')).toEqual({ ok: true })
    const [user] = await db.select().from(users).where(eq(users.email, input.email))
    expect(user?.status).toBe('PENDING_VERIFICATION')
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/)

    // Connexion refusée tant que l'email n'est pas confirmé.
    expect(await authenticate(input.email, input.password, 'ip-1')).toEqual({
      ok: false,
      reason: 'EMAIL_NOT_VERIFIED',
    })

    const token = 'x'.repeat(43)
    await knownToken(user!.id, 'EMAIL_VERIFICATION', token)
    expect(await verifyEmail(token)).toBe('VERIFIED')
    expect(await verifyEmail(token)).toBe('INVALID')

    const admin = await createMember({ role: 'ADMIN' })
    expect(await approveMember(admin.id, user!.id, '2099-12-31')).toEqual({ ok: true })
    const [approved] = await db.select().from(users).where(eq(users.id, user!.id))
    expect(approved).toMatchObject({ status: 'ACTIVE', membershipValidUntil: '2099-12-31' })
    expect(approved?.memberNumber).toMatch(/^95-\d{4}-\d{4}$/)
    expect(await approveMember(admin.id, user!.id, '2099-12-31')).toMatchObject({ ok: false })

    expect(await authenticate(input.email, input.password, 'ip-1')).toMatchObject({ ok: true })
  })

  it('ne révèle pas qu’une adresse est déjà inscrite', async () => {
    await registerMember(input, 'ip-1')
    expect(await registerMember({ ...input, firstName: 'Autre' }, 'ip-2')).toEqual({ ok: true })
    expect(await db.select().from(users)).toHaveLength(1)
  })
})

describe('connexion', () => {
  beforeEach(resetDatabase)

  it('répond de la même façon pour un compte inconnu et un mauvais mot de passe', async () => {
    await registerMember(input, 'ip-1')
    await db.update(users).set({ status: 'ACTIVE' })
    expect(await authenticate('inconnu@example.fr', 'peu importe', 'ip-1')).toEqual({
      ok: false,
      reason: 'INVALID_CREDENTIALS',
    })
    expect(await authenticate(input.email, 'mauvais mot de passe', 'ip-1')).toEqual({
      ok: false,
      reason: 'INVALID_CREDENTIALS',
    })
  })

  it('bloque après 5 échecs sur une même adresse, même avec le bon mot de passe', async () => {
    await registerMember(input, 'ip-1')
    await db.update(users).set({ status: 'ACTIVE' })
    for (let attempt = 0; attempt < 5; attempt += 1) await authenticate(input.email, 'mauvais', 'ip-1')
    expect(await authenticate(input.email, input.password, 'ip-1')).toMatchObject({
      ok: false,
      reason: 'RATE_LIMITED',
    })
  })

  it('refuse un compte suspendu', async () => {
    await registerMember(input, 'ip-1')
    await db.update(users).set({ status: 'SUSPENDED' })
    expect(await authenticate(input.email, input.password, 'ip-1')).toEqual({
      ok: false,
      reason: 'SUSPENDED',
    })
  })
})

describe('réinitialisation du mot de passe', () => {
  beforeEach(resetDatabase)

  it('le lien ne sert qu’une fois et remplace le mot de passe', async () => {
    await registerMember(input, 'ip-1')
    const [user] = await db.update(users).set({ status: 'ACTIVE' }).returning()
    await db.delete(userTokens)
    expect(await requestPasswordReset(input.email, 'ip-1')).toEqual({ ok: true })
    const token = 'y'.repeat(43)
    await knownToken(user!.id, 'PASSWORD_RESET', token)

    expect(await resetPassword(token, 'nouvelle phrase de passe')).toBe(true)
    expect(await resetPassword(token, 'encore une autre phrase')).toBe(false)
    expect(await authenticate(input.email, 'nouvelle phrase de passe', 'ip-2')).toMatchObject({ ok: true })
  })

  it('répond pareil pour une adresse inconnue', async () => {
    expect(await requestPasswordReset('inconnu@example.fr', 'ip-1')).toEqual({ ok: true })
    expect(await db.select().from(userTokens)).toHaveLength(0)
  })
})

describe('rôles et limitation de débit', () => {
  beforeEach(resetDatabase)

  it('un administrateur ne peut pas modifier son propre rôle', async () => {
    const admin = await createMember({ role: 'ADMIN' })
    expect(await changeMemberRole(admin.id, admin.id, 'MEMBER')).toMatchObject({ ok: false })
  })

  it('compte les tentatives de manière atomique', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => consumeRateLimit('test:key', 4, 60_000)),
    )
    expect(results.filter((result) => result.allowed)).toHaveLength(4)
  })
})
