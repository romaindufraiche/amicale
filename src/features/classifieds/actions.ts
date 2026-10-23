'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { classifiedSchema } from './schemas'
import { deleteClassified, saveClassified } from './service'

function revalidateClassifieds() {
  revalidatePath('/annonces', 'layout')
  revalidatePath('/admin/annonces', 'layout')
}

export async function saveClassifiedAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('save-classified', formData, async () => {
    const actor = await requirePermission('classifieds:manage')
    const classifiedId = z.uuid().safeParse(formData.get('classifiedId'))
    const parsed = classifiedSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const savedId = await saveClassified(
      actor.id,
      classifiedId.success ? classifiedId.data : null,
      parsed.data,
    )
    if (!savedId) return errorState('Annonce introuvable.')
    revalidateClassifieds()
    redirect(`/admin/annonces/${savedId}?enregistre=1`)
  })
}

export async function deleteClassifiedAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('delete-classified', formData, async () => {
    const actor = await requirePermission('classifieds:manage')
    const id = z.uuid().safeParse(formData.get('classifiedId'))
    if (!id.success || !(await deleteClassified(actor.id, id.data))) return errorState('Annonce introuvable.')
    revalidateClassifieds()
    redirect('/admin/annonces?supprime=1')
  })
}
