'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { partnerSchema } from './schemas'
import { savePartner } from './service'

export async function savePartnerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('save-partner', formData, async () => {
    const actor = await requirePermission('partners:manage')
    const partnerId = z.uuid().safeParse(formData.get('partnerId'))
    const parsed = partnerSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const savedId = await savePartner(actor.id, partnerId.success ? partnerId.data : null, parsed.data)
    if (!savedId) return errorState('Partenaire introuvable.')

    revalidatePath('/admin/partenaires', 'layout')
    revalidatePath('/partenaires')
    redirect(`/admin/partenaires/${savedId}?enregistre=1`)
  })
}
