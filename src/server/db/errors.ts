/**
 * Détecte une violation de contrainte d'unicité PostgreSQL (code 23505).
 * Drizzle enveloppe l'erreur du pilote : on inspecte aussi la chaîne `cause`.
 */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  if (typeof error !== 'object' || error === null) return false
  if ('code' in error && error.code === '23505') {
    return !constraint || ('constraint_name' in error && error.constraint_name === constraint)
  }
  return 'cause' in error && isUniqueViolation(error.cause, constraint)
}
