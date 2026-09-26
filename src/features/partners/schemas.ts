import { z } from 'zod'
import { OFFER_CATEGORIES } from '@/features/offers/labels'

export const partnerSchema = z.object({
  name: z.string().trim().min(2, { error: 'Nom requis.' }).max(100),
  category: z.enum(OFFER_CATEGORIES, { error: 'Catégorie invalide.' }),
  advantage: z
    .string()
    .trim()
    .min(5, { error: 'Décrivez l’avantage en une phrase.' })
    .max(160, { error: '160 caractères maximum.' }),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => (value === '' ? null : value)),
  howToBenefit: z.string().trim().min(5, { error: 'Indiquez comment en bénéficier.' }).max(1000),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .refine((value) => value === '' || /^https?:\/\//i.test(value), {
      error: 'Adresse web invalide (https://…).',
    })
    .refine((value) => value === '' || URL.canParse(value), { error: 'Adresse web invalide (https://…).' })
    .transform((value) => (value === '' ? null : value)),
  published: z
    .string()
    .optional()
    .transform((value) => value === 'on'),
})

export type PartnerInput = z.output<typeof partnerSchema>
