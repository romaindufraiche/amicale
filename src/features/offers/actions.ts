'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, formValues, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { offerFormToObject, offerSchema, offerStatusSchema } from './schemas'
import { createOffer, setOfferStatus, updateOffer } from './service'

export async function saveOfferAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('save-offer', formData, async () => {
    const actor = await requirePermission('offers:manage')
    const offerId = z.uuid().safeParse(formData.get('offerId'))
    const parsed = offerSchema.safeParse(offerFormToObject(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const result = offerId.success
      ? await updateOffer(actor.id, offerId.data, parsed.data)
      : await createOffer(actor.id, parsed.data)
    if (!result.ok) {
      return {
        status: 'error',
        message: result.message,
        fieldErrors: result.field ? { [result.field]: result.message } : undefined,
        values: formValues(formData),
      }
    }

    revalidatePath('/admin/offres')
    revalidatePath('/espace/billetterie', 'layout')
    redirect(`/admin/offres/${result.offerId}?enregistree=1`)
  })
}

export async function setOfferStatusAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('set-offer-status', formData, async () => {
    const actor = await requirePermission('offers:manage')
    const parsed = offerStatusSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Action invalide.')
    const done = await setOfferStatus(actor.id, parsed.data.offerId, parsed.data.status)
    if (!done) return errorState('Offre introuvable.')
    revalidatePath('/admin/offres', 'layout')
    revalidatePath('/espace/billetterie', 'layout')
    const messages = {
      PUBLISHED: 'Offre mise en ligne : elle est visible des adhérents.',
      DRAFT: 'Offre repassée en brouillon : elle n’est plus visible des adhérents.',
      ARCHIVED: 'Offre archivée.',
    } as const
    return { status: 'success', message: messages[parsed.data.status] }
  })
}
