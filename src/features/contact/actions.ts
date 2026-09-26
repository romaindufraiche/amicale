'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { logger } from '@/server/logger'
import { formatRetryAfter } from '@/server/rate-limit'
import { getClientIp } from '@/server/request-context'
import { contactSchema } from './schemas'
import { markMessageHandled, submitContactMessage } from './service'

const SENT: FormState = {
  status: 'success',
  message: 'Message envoyé. Le bureau vous répondra par email dans les meilleurs délais.',
}

export async function contactAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('contact', formData, async () => {
    const parsed = contactSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
      // Robot détecté par le champ piège : on simule un succès sans rien enregistrer.
      if (parsed.error.issues.some((issue) => issue.path[0] === 'website')) {
        logger.warn('contact.honeypot')
        return SENT
      }
      return validationError(parsed.error, formData)
    }
    const { website: _honeypot, ...message } = parsed.data
    const result = await submitContactMessage(message, await getClientIp())
    if (!result.ok) {
      return errorState(
        `Vous avez envoyé plusieurs messages récemment. Réessayez ${formatRetryAfter(result.retryAfterSeconds)}.`,
        formData,
      )
    }
    return SENT
  })
}

export async function markMessageHandledAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('mark-message-handled', formData, async () => {
    const actor = await requirePermission('messages:manage')
    const id = z.uuid().safeParse(formData.get('messageId'))
    if (!id.success || !(await markMessageHandled(actor.id, id.data)))
      return errorState('Message introuvable.')
    revalidatePath('/admin', 'layout')
    return { status: 'success', message: 'Message marqué comme traité.' }
  })
}
