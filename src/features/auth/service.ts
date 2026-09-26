import 'server-only'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { site } from '@/config/site'
import { generateToken, hashToken } from '@/server/auth/crypto'
import { hashPassword, verifyAgainstDummy, verifyPassword } from '@/server/auth/password'
import { revokeUserSessions } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { users, userTokens, type User } from '@/server/db/schema'
import { env } from '@/server/env'
import { logger } from '@/server/logger'
import { sendEmail } from '@/server/mail/transport'
import { consumeRateLimit, resetRateLimit } from '@/server/rate-limit'
import type { RegisterInput } from './schemas'
import { isUniqueViolation } from '@/server/db/errors'

const EMAIL_VERIFICATION_TTL_MS = 48 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000
const FIFTEEN_MINUTES = 15 * 60 * 1000
const ONE_HOUR = 60 * 60 * 1000

async function issueToken(userId: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<string> {
  const token = generateToken()
  const ttl = purpose === 'EMAIL_VERIFICATION' ? EMAIL_VERIFICATION_TTL_MS : PASSWORD_RESET_TTL_MS
  await db.transaction(async (tx) => {
    // Un seul lien valide à la fois : les précédents sont invalidés.
    await tx
      .delete(userTokens)
      .where(and(eq(userTokens.userId, userId), eq(userTokens.purpose, purpose), isNull(userTokens.usedAt)))
    await tx
      .insert(userTokens)
      .values({ id: hashToken(token), userId, purpose, expiresAt: new Date(Date.now() + ttl) })
  })
  return token
}

async function sendVerificationEmail(user: Pick<User, 'id' | 'email' | 'firstName'>): Promise<void> {
  const token = await issueToken(user.id, 'EMAIL_VERIFICATION')
  await sendEmail(user.email, {
    subject: 'Confirmez votre adresse email',
    paragraphs: [
      `Bonjour ${user.firstName},`,
      `Vous avez demandé à adhérer à l'${site.legalName}. Confirmez votre adresse email pour transmettre votre demande au bureau.`,
      'Ce lien est valable 48 heures.',
    ],
    action: { label: 'Confirmer mon adresse', url: `${env.APP_URL}/verification-email?token=${token}` },
  })
}

// ─── Inscription ────────────────────────────────────────────────────────────

export type RegisterResult = { ok: true } | { ok: false; reason: 'RATE_LIMITED'; retryAfterSeconds: number }

/**
 * Crée une demande d'adhésion. La réponse est identique que l'adresse soit déjà
 * inscrite ou non (pas d'énumération des comptes) ; le titulaire d'une adresse déjà
 * inscrite est prévenu par email.
 */
export async function registerMember(input: RegisterInput, clientIp: string): Promise<RegisterResult> {
  const limit = await consumeRateLimit(`register:ip:${clientIp}`, 10, ONE_HOUR)
  if (!limit.allowed) return { ok: false, reason: 'RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds }

  const passwordHash = await hashPassword(input.password)
  try {
    const [created] = await db
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        category: input.category,
        assignment: input.assignment,
      })
      .returning({ id: users.id, email: users.email, firstName: users.firstName })
    if (created) {
      await sendVerificationEmail(created)
      logger.info('member.registered', { userId: created.id })
    }
  } catch (error) {
    if (!isUniqueViolation(error)) throw error
    const emailLimit = await consumeRateLimit(`register:existing:${input.email}`, 3, ONE_HOUR)
    if (emailLimit.allowed) {
      await sendEmail(input.email, {
        subject: 'Tentative d’inscription avec votre adresse',
        paragraphs: [
          'Bonjour,',
          `Une demande d'adhésion vient d'être faite avec votre adresse email, qui est déjà associée à un compte de l'${site.legalName}.`,
          "S'il s'agit de vous, connectez-vous avec votre mot de passe habituel ou réinitialisez-le. Sinon, vous pouvez ignorer ce message.",
        ],
        action: { label: 'Réinitialiser mon mot de passe', url: `${env.APP_URL}/mot-de-passe-oublie` },
      })
    }
  }
  return { ok: true }
}

// ─── Vérification de l'email ────────────────────────────────────────────────

export type VerifyEmailResult = 'VERIFIED' | 'INVALID'

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  if (token.length < 20 || token.length > 100) return 'INVALID'
  const tokenId = hashToken(token)

  const verifiedUserId = await db.transaction(async (tx) => {
    const [consumed] = await tx
      .update(userTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(userTokens.id, tokenId),
          eq(userTokens.purpose, 'EMAIL_VERIFICATION'),
          isNull(userTokens.usedAt),
          gt(userTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: userTokens.userId })
    if (!consumed) return null

    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date(), status: 'PENDING_APPROVAL' })
      .where(and(eq(users.id, consumed.userId), eq(users.status, 'PENDING_VERIFICATION')))
    return consumed.userId
  })

  if (!verifiedUserId) return 'INVALID'

  logger.info('member.email_verified', { userId: verifiedUserId })
  await sendEmail(env.BUREAU_EMAIL, {
    subject: "Nouvelle demande d'adhésion",
    paragraphs: ["Une nouvelle demande d'adhésion est en attente d'examen dans l'espace bureau."],
    action: { label: 'Examiner les demandes', url: `${env.APP_URL}/admin/adherents?statut=PENDING_APPROVAL` },
  })
  return 'VERIFIED'
}

// ─── Connexion ──────────────────────────────────────────────────────────────

export type AuthenticateResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'SUSPENDED' | 'REJECTED' }
  | { ok: false; reason: 'RATE_LIMITED'; retryAfterSeconds: number }

export async function authenticate(
  email: string,
  password: string,
  clientIp: string,
): Promise<AuthenticateResult> {
  const emailKey = `login:email:${email}`
  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit(`login:ip:${clientIp}`, 30, FIFTEEN_MINUTES),
    consumeRateLimit(emailKey, 5, FIFTEEN_MINUTES),
  ])
  if (!byIp.allowed || !byEmail.allowed) {
    logger.warn('auth.rate_limited', { scope: byIp.allowed ? 'email' : 'ip' })
    return {
      ok: false,
      reason: 'RATE_LIMITED',
      retryAfterSeconds: Math.max(
        byIp.allowed ? 0 : byIp.retryAfterSeconds,
        byEmail.allowed ? 0 : byEmail.retryAfterSeconds,
      ),
    }
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      passwordHash: users.passwordHash,
      status: users.status,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  const valid = user ? await verifyPassword(user.passwordHash, password) : await verifyAgainstDummy(password)
  if (!user || !valid) return { ok: false, reason: 'INVALID_CREDENTIALS' }

  // Le mot de passe est correct : les messages suivants ne révèlent rien à un tiers.
  if (user.status === 'SUSPENDED') return { ok: false, reason: 'SUSPENDED' }
  if (user.status === 'REJECTED') return { ok: false, reason: 'REJECTED' }
  if (user.status === 'PENDING_VERIFICATION') {
    const resend = await consumeRateLimit(`verify:resend:${user.id}`, 3, ONE_HOUR)
    if (resend.allowed) await sendVerificationEmail(user)
    return { ok: false, reason: 'EMAIL_NOT_VERIFIED' }
  }

  await resetRateLimit(emailKey)
  logger.info('auth.login', { userId: user.id })
  return { ok: true, userId: user.id }
}

// ─── Mot de passe oublié ────────────────────────────────────────────────────

export type PasswordResetRequestResult =
  { ok: true } | { ok: false; reason: 'RATE_LIMITED'; retryAfterSeconds: number }

export async function requestPasswordReset(
  email: string,
  clientIp: string,
): Promise<PasswordResetRequestResult> {
  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit(`reset:ip:${clientIp}`, 10, ONE_HOUR),
    consumeRateLimit(`reset:email:${email}`, 3, ONE_HOUR),
  ])
  if (!byIp.allowed) return { ok: false, reason: 'RATE_LIMITED', retryAfterSeconds: byIp.retryAfterSeconds }
  // Limite par adresse atteinte : réponse identique, aucun email supplémentaire.
  if (!byEmail.allowed) return { ok: true }

  const [user] = await db
    .select({ id: users.id, firstName: users.firstName, status: users.status })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (!user || user.status === 'REJECTED') return { ok: true }

  const token = await issueToken(user.id, 'PASSWORD_RESET')
  await sendEmail(email, {
    subject: 'Réinitialisation de votre mot de passe',
    paragraphs: [
      `Bonjour ${user.firstName},`,
      'Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable une heure et ne peut servir qu’une fois.',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.",
    ],
    action: {
      label: 'Choisir un nouveau mot de passe',
      url: `${env.APP_URL}/reinitialisation?token=${token}`,
    },
  })
  logger.info('auth.password_reset_requested', { userId: user.id })
  return { ok: true }
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  if (token.length < 20 || token.length > 100) return false
  const [row] = await db
    .select({ id: userTokens.id })
    .from(userTokens)
    .where(
      and(
        eq(userTokens.id, hashToken(token)),
        eq(userTokens.purpose, 'PASSWORD_RESET'),
        isNull(userTokens.usedAt),
        gt(userTokens.expiresAt, new Date()),
      ),
    )
    .limit(1)
  return Boolean(row)
}

/** Consomme le lien, change le mot de passe et ferme toutes les sessions ouvertes. */
export async function resetPassword(token: string, password: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  const userId = await db.transaction(async (tx) => {
    const [consumed] = await tx
      .update(userTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(userTokens.id, hashToken(token)),
          eq(userTokens.purpose, 'PASSWORD_RESET'),
          isNull(userTokens.usedAt),
          gt(userTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: userTokens.userId })
    if (!consumed) return null
    await tx.update(users).set({ passwordHash }).where(eq(users.id, consumed.userId))
    return consumed.userId
  })
  if (!userId) return false
  await revokeUserSessions(userId)
  logger.info('auth.password_reset', { userId })
  return true
}

// ─── Espace adhérent ────────────────────────────────────────────────────────

export async function changePassword(
  userId: string,
  currentSessionId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user || !(await verifyPassword(user.passwordHash, currentPassword))) return false
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, userId))
  await revokeUserSessions(userId, currentSessionId)
  logger.info('auth.password_changed', { userId })
  return true
}
