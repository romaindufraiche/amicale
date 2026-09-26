import type { User } from '@/server/db/schema'

type MembershipFields = Pick<User, 'status' | 'membershipValidUntil'>

/** Cotisation à jour : compte actif et date de validité non dépassée (`today` au format YYYY-MM-DD). */
export function hasValidMembership(user: MembershipFields, today: string): boolean {
  return user.status === 'ACTIVE' && user.membershipValidUntil !== null && user.membershipValidUntil >= today
}

/** Date de fin de cotisation proposée par défaut lors d'une validation : 31 décembre de l'année en cours. */
export function defaultMembershipEnd(today: string): string {
  return `${today.slice(0, 4)}-12-31`
}

/** Numéro d'adhérent lisible, dérivé d'un compteur : (2026, 7) → « 95-2026-0007 ». */
export function formatMemberNumber(year: number, sequence: number): string {
  return `95-${year}-${String(sequence).padStart(4, '0')}`
}
