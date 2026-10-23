import { z } from 'zod'
import { CLASSIFIED_KIND_VALUES } from './labels'

/** Case à cocher : présente (« on ») ou absente du formulaire. */
const checkbox = z
  .string()
  .optional()
  .transform((value) => value === 'on')

export const classifiedSchema = z.object({
  kind: z.enum(CLASSIFIED_KIND_VALUES, { error: 'Choisissez le type d’annonce.' }),
  title: z
    .string()
    .trim()
    .min(3, { error: 'Titre requis (3 caractères minimum).' })
    .max(100, { error: '100 caractères maximum.' }),
  description: z
    .string()
    .trim()
    .min(5, { error: 'Description requise.' })
    .max(3000, { error: '3000 caractères maximum.' }),
  imageId: z
    .union([z.uuid(), z.literal('')], { error: 'Image invalide.' })
    .optional()
    .transform((value) => value || null),
  pinned: checkbox,
  published: checkbox,
})

export type ClassifiedInput = z.output<typeof classifiedSchema>
