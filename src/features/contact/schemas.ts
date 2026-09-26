import { z } from 'zod'
import { emailField } from '@/features/auth/schemas'

export const CONTACT_SUBJECTS = [
  'Adhésion',
  'Billetterie et commandes',
  'Sorties et événements',
  'Partenariat',
  'Autre demande',
] as const

export const contactSchema = z.object({
  name: z.string().trim().min(2, { error: 'Indiquez votre nom.' }).max(100),
  email: emailField,
  subject: z.enum(CONTACT_SUBJECTS, { error: 'Choisissez un objet.' }),
  message: z
    .string()
    .trim()
    .min(20, { error: 'Votre message doit contenir au moins 20 caractères.' })
    .max(4000, { error: '4 000 caractères maximum.' }),
  /** Champ piège invisible : un humain le laisse vide, un robot le remplit. */
  website: z.string().max(0).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
