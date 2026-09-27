import { z } from 'zod'
import { fromParisDateTimeInput } from '@/lib/dates'
import { parseEurosToCents } from '@/lib/money'
import { slugify } from '@/lib/slug'
import { OFFER_CATEGORIES } from './labels'

/**
 * Champs facultatifs : absents du formulaire selon le type d'offre (une sortie n'a pas
 * de date de validité, un billet n'a ni date ni lieu), ils valent alors « vide ».
 */
const text = () =>
  z
    .string()
    .optional()
    .transform((value) => (value ?? '').trim())

const optionalText = (max: number) =>
  text()
    .refine((value) => value.length <= max, { error: `${max} caractères maximum.` })
    .transform((value) => (value === '' ? null : value))

const optionalDateTime = text().transform((value, ctx) => {
  if (value === '') return null
  const date = fromParisDateTimeInput(value)
  if (!date) {
    ctx.addIssue({ code: 'custom', message: 'Date et heure invalides.' })
    return z.NEVER
  }
  return date
})

const optionalDate = text()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), { error: 'Date invalide.' })
  .transform((value) => (value === '' ? null : value))

const optionalPositiveInt = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d{1,6}$/.test(value), {
      error: `${label} : nombre entier attendu.`,
    })
    .transform((value) => (value === '' ? null : Number(value)))

const requiredCents = z.string().transform((value, ctx) => {
  const cents = parseEurosToCents(value)
  if (cents === null) {
    ctx.addIssue({ code: 'custom', message: 'Montant invalide (ex. 12,50).' })
    return z.NEVER
  }
  return cents
})

const optionalCents = z.string().transform((value, ctx) => {
  if (value.trim() === '') return null
  const cents = parseEurosToCents(value)
  if (cents === null) {
    ctx.addIssue({ code: 'custom', message: 'Montant invalide (ex. 12,50).' })
    return z.NEVER
  }
  return cents
})

export const tariffSchema = z.object({
  id: z.union([z.uuid(), z.literal('')]).transform((value) => (value === '' ? null : value)),
  label: z.string().trim().min(1, { error: 'Libellé requis.' }).max(80, { error: '80 caractères maximum.' }),
  memberPrice: requiredCents,
  publicPrice: optionalCents,
  stock: optionalPositiveInt('Stock'),
  active: z
    .string()
    .optional()
    .transform((value) => value === 'on'),
})

export const offerSchema = z
  .object({
    title: z.string().trim().min(3, { error: 'Titre requis (3 caractères minimum).' }).max(120),
    slug: z.string().trim().max(80),
    kind: z.enum(['TICKET', 'EVENT'], { error: 'Type invalide.' }),
    category: z.enum(OFFER_CATEGORIES, { error: 'Catégorie invalide.' }),
    summary: z
      .string()
      .trim()
      .min(10, { error: 'Résumé requis (10 caractères minimum).' })
      .max(220, { error: '220 caractères maximum.' }),
    description: z
      .string()
      .trim()
      .min(20, { error: 'Description requise (20 caractères minimum).' })
      .max(8000),
    pickupInfo: optionalText(500),
    location: optionalText(200),
    eventStartsAt: optionalDateTime,
    validUntil: optionalDate,
    orderDeadline: optionalDateTime,
    maxPerMember: optionalPositiveInt('Limite par adhérent'),
    imageId: z
      .union([z.uuid(), z.literal('')], { error: 'Image invalide.' })
      .optional()
      .transform((value) => value || null),
    featured: z
      .string()
      .optional()
      .transform((value) => value === 'on'),
    tariffs: z.array(tariffSchema).min(1, { error: 'Ajoutez au moins un tarif.' }).max(12),
  })
  .transform((data) => ({ ...data, slug: slugify(data.slug || data.title) }))
  .superRefine((data, ctx) => {
    if (data.slug.length < 3)
      ctx.addIssue({ code: 'custom', path: ['slug'], message: 'Adresse de page trop courte.' })
    if (data.kind === 'EVENT' && !data.eventStartsAt) {
      ctx.addIssue({ code: 'custom', path: ['eventStartsAt'], message: 'La date de la sortie est requise.' })
    }
    if (data.maxPerMember === 0)
      ctx.addIssue({ code: 'custom', path: ['maxPerMember'], message: 'Doit être supérieur à 0.' })
    if (data.orderDeadline && data.eventStartsAt && data.orderDeadline > data.eventStartsAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['orderDeadline'],
        message: 'La clôture doit précéder la date de la sortie.',
      })
    }
    data.tariffs.forEach((tariff, index) => {
      if (tariff.publicPrice !== null && tariff.publicPrice < tariff.memberPrice) {
        ctx.addIssue({
          code: 'custom',
          path: ['tariffs', index, 'publicPrice'],
          message: 'Le prix public ne peut pas être inférieur au prix adhérent.',
        })
      }
    })
  })

export type OfferInput = z.output<typeof offerSchema>

/**
 * Reconstitue l'objet à valider depuis le FormData.
 * Les tarifs arrivent sous la forme `tariffs.<index>.<champ>`.
 */
export function offerFormToObject(formData: FormData) {
  const fields: Record<string, string> = {}
  const tariffs = new Map<number, Record<string, string>>()
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') continue
    const match = /^tariffs\.(\d{1,2})\.(id|label|memberPrice|publicPrice|stock|active)$/.exec(key)
    if (match) {
      const index = Number(match[1])
      const row = tariffs.get(index) ?? {}
      row[match[2] as string] = value
      tariffs.set(index, row)
    } else if (!key.startsWith('$')) {
      fields[key] = value
    }
  }
  const rows = [...tariffs.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => ({ id: '', publicPrice: '', stock: '', ...row }))
  return { ...fields, tariffs: rows }
}

export const offerStatusSchema = z.object({
  offerId: z.uuid(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})
