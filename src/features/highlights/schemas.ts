import { z } from 'zod'
import { fromParisDateTimeInput } from '@/lib/dates'
import { HIGHLIGHT_TONE_VALUES } from './labels'

const optionalDateTime = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === '') return null
    const date = fromParisDateTimeInput(value)
    if (!date) {
      ctx.addIssue({ code: 'custom', message: 'Date et heure invalides.' })
      return z.NEVER
    }
    return date
  })

/** Lien interne (/offres/…) ou externe en https uniquement. */
export function isAllowedLink(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//') && !value.startsWith('/\\')
  return /^https:\/\//i.test(value) && URL.canParse(value)
}

export const highlightSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { error: 'Titre requis (3 caractères minimum).' })
      .max(80, { error: '80 caractères maximum.' }),
    body: z.string().trim().min(5, { error: 'Texte requis.' }).max(220, { error: '220 caractères maximum.' }),
    linkUrl: z
      .string()
      .trim()
      .max(300)
      .refine((value) => value === '' || isAllowedLink(value), {
        error: 'Lien invalide : chemin du site (/offres) ou adresse https://…',
      })
      .transform((value) => (value === '' ? null : value)),
    linkLabel: z
      .string()
      .trim()
      .max(40, { error: '40 caractères maximum.' })
      .transform((value) => (value === '' ? null : value)),
    tone: z.enum(HIGHLIGHT_TONE_VALUES, { error: 'Couleur invalide.' }),
    imageId: z
      .union([z.uuid(), z.literal('')], { error: 'Image invalide.' })
      .optional()
      .transform((value) => value || null),
    visibility: z.enum(['PUBLIC', 'MEMBERS'], { error: 'Visibilité invalide.' }),
    startsAt: optionalDateTime,
    endsAt: optionalDateTime,
    position: z
      .string()
      .trim()
      .refine((value) => value === '' || /^-?\d{1,4}$/.test(value), { error: 'Nombre entier attendu.' })
      .transform((value) => (value === '' ? 0 : Number(value))),
    published: z
      .string()
      .optional()
      .transform((value) => value === 'on'),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.startsAt >= data.endsAt) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'La fin doit être postérieure au début.' })
    }
    if (data.linkLabel && !data.linkUrl) {
      ctx.addIssue({ code: 'custom', path: ['linkUrl'], message: 'Indiquez le lien associé au libellé.' })
    }
  })

export type HighlightInput = z.output<typeof highlightSchema>
