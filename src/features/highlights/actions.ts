'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { highlightSchema } from './schemas'
import { deleteHighlight, saveHighlight } from './service'

function revalidateHighlights() {
  revalidatePath('/', 'layout')
}

export async function saveHighlightAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('save-highlight', formData, async () => {
    const actor = await requirePermission('news:manage')
    const highlightId = z.uuid().safeParse(formData.get('highlightId'))
    const parsed = highlightSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const savedId = await saveHighlight(actor.id, highlightId.success ? highlightId.data : null, parsed.data)
    if (!savedId) return errorState('Post introuvable.')
    revalidateHighlights()
    redirect(`/admin/a-la-une/${savedId}?enregistre=1`)
  })
}

export async function deleteHighlightAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('delete-highlight', formData, async () => {
    const actor = await requirePermission('news:manage')
    const id = z.uuid().safeParse(formData.get('highlightId'))
    if (!id.success || !(await deleteHighlight(actor.id, id.data))) return errorState('Post introuvable.')
    revalidateHighlights()
    redirect('/admin/a-la-une?supprime=1')
  })
}
