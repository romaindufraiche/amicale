import { z } from 'zod'
import { emailField } from '@/features/auth/schemas'

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} est requis.` })
    .max(60, { error: '60 caractères maximum.' })

export const offerRequestSchema = z.object({
  offerId: z.uuid({ error: 'Offre invalide.' }),
  firstName: nameField('Le prénom'),
  lastName: nameField('Le nom'),
  email: emailField,
  /** Champ piège invisible : un humain le laisse vide, un robot le remplit. */
  website: z.string().max(0).optional(),
})

export type OfferRequestInput = z.infer<typeof offerRequestSchema>

export const REQUEST_FILTERS = ['toutes', 'a-regler', 'reglees'] as const
export type RequestFilter = (typeof REQUEST_FILTERS)[number]

export const REQUEST_FILTER_LABELS: Record<RequestFilter, string> = {
  toutes: 'Toutes',
  'a-regler': 'Non réglées',
  reglees: 'Réglées',
}

export type AdminRequestFilters = { status: RequestFilter; offerId?: string }

/** Filtres de la liste des commandes, lus depuis l'URL : valeurs inconnues ignorées. */
export function parseRequestFilters(params: Record<string, string | undefined>): AdminRequestFilters {
  const status = REQUEST_FILTERS.find((value) => value === params.statut) ?? 'toutes'
  const offerId = z.uuid().safeParse(params.offre)
  return { status, offerId: offerId.success ? offerId.data : undefined }
}

/** Query string canonique des filtres (sans les valeurs par défaut). */
export function requestFiltersQuery(filters: AdminRequestFilters): string {
  const qs = new URLSearchParams()
  if (filters.status !== 'toutes') qs.set('statut', filters.status)
  if (filters.offerId) qs.set('offre', filters.offerId)
  const text = qs.toString()
  return text ? `?${text}` : ''
}
