import { z } from 'zod'
import { emailField } from '@/features/auth/schemas'
import { optionalHttpsUrl } from '@/lib/https-url'

export const settingsSchema = z.object({
  membershipUrl: optionalHttpsUrl,
  ordersEmail: z
    .string()
    .optional()
    .transform((value) => (value ?? '').trim())
    .pipe(z.union([z.literal(''), emailField]))
    .transform((value) => (value === '' ? null : value)),
  /** Case à cocher : présente (« on ») ou absente du formulaire. */
  memberCount: z
    .string()
    .optional()
    .transform((value) => (value ?? '').replace(/\s/g, ''))
    .refine((value) => value === '' || /^\d{1,6}$/.test(value), { error: 'Nombre entier attendu.' })
    .transform((value) => (value === '' ? null : Number(value))),
  membershipOpen: z
    .string()
    .optional()
    .transform((value) => value === 'on'),
})

export type SettingsInput = z.infer<typeof settingsSchema>
