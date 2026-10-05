import { z } from 'zod'
import { optionalHttpsUrl } from '@/lib/https-url'

export const settingsSchema = z.object({
  membershipUrl: optionalHttpsUrl,
})

export type SettingsInput = z.infer<typeof settingsSchema>
