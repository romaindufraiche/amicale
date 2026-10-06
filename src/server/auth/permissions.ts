import type { UserRole } from '@/server/db/schema'

/**
 * Matrice des droits. Toute vérification d'autorisation passe par `can()` côté
 * serveur : masquer un bouton dans l'interface n'est jamais une protection.
 */
const PERMISSIONS = {
  'admin:access': ['BUREAU', 'ADMIN'],
  'offers:manage': ['BUREAU', 'ADMIN'],
  'requests:manage': ['BUREAU', 'ADMIN'],
  'settings:manage': ['BUREAU', 'ADMIN'],
  'news:manage': ['BUREAU', 'ADMIN'],
  'partners:manage': ['BUREAU', 'ADMIN'],
  'messages:manage': ['BUREAU', 'ADMIN'],
  'media:upload': ['BUREAU', 'ADMIN'],
  'audit:read': ['ADMIN'],
} as const satisfies Record<string, readonly UserRole[]>

export type Permission = keyof typeof PERMISSIONS

export function can(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role)
}
