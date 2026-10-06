import 'server-only'
import { and, eq, gt, lt, ne } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from '@/server/db/client'
import { sessions, users, type User } from '@/server/db/schema'
import { isProduction } from '@/server/env'
import { generateToken, hashToken } from './crypto'

/** Préfixe `__Host-` en production : cookie lié à l'origine exacte, HTTPS obligatoire. */
export const SESSION_COOKIE = isProduction ? '__Host-amicale_session' : 'amicale_session'
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000
const RENEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export type SessionUser = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'status'>

export type CurrentSession = { sessionId: string; user: SessionUser }

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    expires,
  }
}

export async function createSession(userId: string, userAgent: string | null): Promise<void> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt, userAgent })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
}

/**
 * Session de la requête courante, mémorisée pour la durée du rendu.
 * Une session expirée ou appartenant à un compte suspendu/refusé est ignorée.
 */
export const getCurrentSession = cache(async (): Promise<CurrentSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token || token.length > 100) return null

  const sessionId = hashToken(token)
  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1)

  if (!row) return null
  if (row.user.status === 'SUSPENDED') return null

  // Expiration glissante : la session est prolongée tant que le membre du bureau revient.
  // Le cookie est rafraîchi en parallèle par le proxy (src/proxy.ts).
  if (row.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(sessions.id, sessionId))
  }

  return { sessionId, user: row.user }
})

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)))
  store.delete(SESSION_COOKIE)
}

/** Déconnecte toutes les sessions d'un compte, sauf éventuellement la session courante. */
export async function revokeUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await db
    .delete(sessions)
    .where(
      exceptSessionId
        ? and(eq(sessions.userId, userId), ne(sessions.id, exceptSessionId))
        : eq(sessions.userId, userId),
    )
}

export async function purgeExpiredSessions(): Promise<number> {
  const deleted = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .returning({ id: sessions.id })
  return deleted.length
}
