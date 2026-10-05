'use server'

import { revalidatePath } from 'next/cache'
import { type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { settingsSchema } from './schemas'
import { updateSiteSettings } from './service'

export async function saveSettingsAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('save-settings', formData, async () => {
    const actor = await requirePermission('settings:manage')
    const parsed = settingsSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    await updateSiteSettings(actor.id, parsed.data)
    revalidatePath('/', 'layout')
    return {
      status: 'success',
      message: 'Réglages enregistrés.',
      values: { membershipUrl: parsed.data.membershipUrl ?? '' },
    }
  })
}
