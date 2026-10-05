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
})

export type SettingsInput = z.infer<typeof settingsSchema>
