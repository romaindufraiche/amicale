import { z } from 'zod'
import { emailField } from '@/features/auth/schemas'
import { CLASSIFIED_KIND_VALUES } from './labels'

/** Case à cocher : présente (« on ») ou absente du formulaire. */
const checkbox = z
  .string()
  .optional()
  .transform((value) => value === 'on')

const optionalImage = z
  .union([z.uuid(), z.literal('')], { error: 'Image invalide.' })
  .optional()
  .transform((value) => value || null)

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
  imageId: optionalImage,
  image2Id: optionalImage,
  pinned: checkbox,
  published: checkbox,
})

export type ClassifiedInput = z.output<typeof classifiedSchema>

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} est requis.` })
    .max(60, { error: '60 caractères maximum.' })

/** « Cette annonce m'intéresse » : coordonnées de l'adhérent intéressé. */
export const classifiedInterestSchema = z.object({
  classifiedId: z.uuid({ error: 'Annonce invalide.' }),
  lastName: nameField('Le nom'),
  firstName: nameField('Le prénom'),
  email: emailField,
  phone: z
    .string()
    .trim()
    .refine((value) => /^\+?[0-9 .()-]{10,20}$/.test(value) && value.replace(/\D/g, '').length >= 10, {
      error: 'Numéro de téléphone invalide (10 chiffres, ex. 06 12 34 56 78).',
    }),
  /** Champ piège invisible : un humain le laisse vide, un robot le remplit. */
  website: z.string().max(0).optional(),
})

export type ClassifiedInterestInput = z.infer<typeof classifiedInterestSchema>
