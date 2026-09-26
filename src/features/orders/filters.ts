import { z } from 'zod'
import { ORDER_STATUSES } from './schemas'
import type { AdminOrderFilters } from './queries'

/** Lit les filtres de la liste des commandes depuis l'URL, en ignorant toute valeur invalide. */
export function parseAdminOrderFilters(
  params: Record<string, string | string[] | undefined>,
): AdminOrderFilters {
  const single = (value: string | string[] | undefined) => (typeof value === 'string' ? value : undefined)
  const status = z.enum(ORDER_STATUSES).safeParse(single(params.statut))
  const offerId = z.uuid().safeParse(single(params.offre))
  const search = single(params.q)?.trim().slice(0, 100)
  return {
    status: status.success ? status.data : undefined,
    offerId: offerId.success ? offerId.data : undefined,
    search: search || undefined,
  }
}

export function adminOrderQuery(filters: AdminOrderFilters, extra: Record<string, string> = {}): string {
  const qs = new URLSearchParams()
  if (filters.search) qs.set('q', filters.search)
  if (filters.status) qs.set('statut', filters.status)
  if (filters.offerId) qs.set('offre', filters.offerId)
  for (const [key, value] of Object.entries(extra)) qs.set(key, value)
  const text = qs.toString()
  return text ? `?${text}` : ''
}
