import type { BadgeTone } from '@/components/ui/badge'
import type { UserRole, UserStatus } from '@/server/db/schema'

export const USER_STATUS: Record<UserStatus, { label: string; tone: BadgeTone }> = {
  PENDING_VERIFICATION: { label: 'Email à confirmer', tone: 'neutral' },
  PENDING_APPROVAL: { label: 'À examiner', tone: 'warning' },
  ACTIVE: { label: 'Adhérent', tone: 'success' },
  SUSPENDED: { label: 'Suspendu', tone: 'danger' },
  REJECTED: { label: 'Refusé', tone: 'neutral' },
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: 'Adhérent',
  BUREAU: 'Membre du bureau',
  ADMIN: 'Administrateur',
}

/** Messages affichés sur la fiche après une décision du bureau (`?resultat=`). */
export const MEMBER_OUTCOMES = {
  validee: "Adhésion validée. L'adhérent a été prévenu par email.",
  refusee: 'Demande refusée. La personne a été prévenue par email.',
  suspendu: 'Compte suspendu : ses sessions ont été fermées.',
  reactive: 'Compte réactivé.',
} as const

export type MemberOutcome = keyof typeof MEMBER_OUTCOMES
