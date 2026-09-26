import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { hasValidMembership } from '@/features/members/membership'
import { parisDay } from '@/lib/dates'
import { can, type Permission } from './permissions'
import { getCurrentSession, type CurrentSession, type SessionUser } from './session'

/**
 * Gardes d'accès, appelées dans chaque page ET chaque action serveur protégée :
 * une action serveur est un point d'entrée HTTP indépendant de la page qui l'affiche.
 */

export async function requireSession(nextPath?: string): Promise<CurrentSession> {
  const session = await getCurrentSession()
  if (!session) {
    redirect(nextPath ? `/connexion?next=${encodeURIComponent(nextPath)}` : '/connexion')
  }
  return session
}

export async function requireUser(nextPath?: string): Promise<SessionUser> {
  return (await requireSession(nextPath)).user
}

/** Adhérent dont l'adhésion a été validée par le bureau. */
export async function requireActiveMember(nextPath?: string): Promise<SessionUser> {
  const user = await requireUser(nextPath)
  if (user.status !== 'ACTIVE') redirect('/espace')
  return user
}

export function isMembershipValid(user: SessionUser): boolean {
  return hasValidMembership(user, parisDay())
}

/**
 * Accès au back-office. Un compte sans le droit requis reçoit une 404 :
 * l'existence des pages d'administration n'est pas révélée.
 */
export async function requirePermission(permission: Permission, nextPath?: string): Promise<SessionUser> {
  const user = await requireUser(nextPath)
  if (user.status !== 'ACTIVE' || !can(user.role, permission)) notFound()
  return user
}
