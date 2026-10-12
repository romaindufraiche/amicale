import { z } from 'zod'
import { OFFER_CATEGORIES } from '@/features/offers/labels'

export const partnerSchema = z.object({
  name: z.string().trim().min(2, { error: 'Nom requis.' }).max(100),
  category: z.enum(OFFER_CATEGORIES, { error: 'Catégorie invalide.' }),
  advantage: z
    .string()
    .trim()
    .max(160, { error: '160 caractères maximum.' })
    .transform((value) => (value === '' ? null : value)),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => (value === '' ? null : value)),
  howToBenefit: z
    .string()
    .trim()
    .max(1000)
    .transform((value) => (value === '' ? null : value)),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .refine((value) => value === '' || /^https?:\/\//i.test(value), {
      error: 'Adresse web invalide (https://…).',
    })
    .refine((value) => value === '' || URL.canParse(value), { error: 'Adresse web invalide (https://…).' })
    .transform((value) => (value === '' ? null : value)),
  imageId: z
    .union([z.uuid(), z.literal('')], { error: 'Image invalide.' })
    .optional()
    .transform((value) => value || null),
  attachmentId: z
    .union([z.uuid(), z.literal('')], { error: 'Fichier invalide.' })
    .optional()
    .transform((value) => value || null),
  published: z
    .string()
    .optional()
    .transform((value) => value === 'on'),
})

export type PartnerInput = z.output<typeof partnerSchema>
