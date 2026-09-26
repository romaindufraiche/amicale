'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, formValues, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { newsSchema, newsStatusSchema } from './schemas'
import { saveNews, setNewsStatus } from './service'

export async function saveNewsAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('save-news', formData, async () => {
    const actor = await requirePermission('news:manage')
    const newsId = z.uuid().safeParse(formData.get('newsId'))
    const parsed = newsSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const result = await saveNews(actor.id, newsId.success ? newsId.data : null, parsed.data)
    if (!result.ok) {
      return {
        status: 'error',
        message: result.message,
        fieldErrors: result.field ? { [result.field]: result.message } : undefined,
        values: formValues(formData),
      }
    }
    revalidatePath('/actualites', 'layout')
    revalidatePath('/admin/actualites', 'layout')
    redirect(`/admin/actualites/${result.newsId}?enregistree=1`)
  })
}

export async function setNewsStatusAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('set-news-status', formData, async () => {
    const actor = await requirePermission('news:manage')
    const parsed = newsStatusSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Action invalide.')
    const done = await setNewsStatus(actor.id, parsed.data.newsId, parsed.data.status)
    if (!done) return errorState('Actualité introuvable.')
    revalidatePath('/actualites', 'layout')
    revalidatePath('/admin/actualites', 'layout')
    const messages = {
      PUBLISHED: 'Actualité publiée.',
      DRAFT: 'Actualité repassée en brouillon.',
      ARCHIVED: 'Actualité archivée.',
    } as const
    return { status: 'success', message: messages[parsed.data.status] }
  })
}
