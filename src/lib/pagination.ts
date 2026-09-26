export const PAGE_SIZE = 20

/** Lit un numéro de page depuis l'URL : toute valeur invalide ramène à la page 1. */
export function parsePage(value: unknown): number {
  const page = typeof value === 'string' ? Number.parseInt(value, 10) : NaN
  return Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : 1
}

export function pageCount(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize))
}
