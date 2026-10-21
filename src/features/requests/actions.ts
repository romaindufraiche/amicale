'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { logger } from '@/server/logger'
import { formatRetryAfter } from '@/server/rate-limit'
import { getClientIp } from '@/server/request-context'
import { offerRequestFormToObject, offerRequestSchema } from './schemas'
import { deleteRequest, setRequestPaid, setRequestProcessed, submitOfferRequest } from './service'

const UNAVAILABLE_MESSAGES = {
  UNAVAILABLE: 'Cette offre n’est plus disponible à la commande.',
  INVALID_TARIFF: 'Un des tarifs choisis n’est plus disponible. Rechargez la page.',
  STOCK: 'Il ne reste pas assez de places pour cette quantité. Réduisez le nombre de billets.',
} as const

export async function submitOfferRequestAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('offer-request', formData, async () => {
    const parsed = offerRequestSchema.safeParse(offerRequestFormToObject(formData))
    if (!parsed.success) {
      // Robot détecté par le champ piège : rien n'est enregistré.
      if (parsed.error.issues.some((issue) => issue.path[0] === 'website')) {
        logger.warn('offer_request.honeypot')
        return { status: 'success', message: 'Commande envoyée.' }
      }
      return validationError(parsed.error, formData)
    }
    const { website: _honeypot, ...input } = parsed.data
    const result = await submitOfferRequest(input, await getClientIp())
    if (!result.ok) {
      return errorState(
        result.reason === 'RATE_LIMITED'
          ? `Vous avez envoyé plusieurs commandes récemment. Réessayez ${formatRetryAfter(result.retryAfterSeconds)}.`
          : UNAVAILABLE_MESSAGES[result.reason],
        formData,
      )
    }
    revalidatePath('/admin', 'layout')
    return { status: 'success', message: 'Commande envoyée.' }
  })
}

const requestIdSchema = z.object({
  requestId: z.uuid(),
  paid: z.enum(['0', '1']).optional(),
  processed: z.enum(['0', '1']).optional(),
})

export async function setRequestPaidAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('set-request-paid', formData, async () => {
    const actor = await requirePermission('requests:manage')
    const parsed = requestIdSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Action invalide.')
    const paid = parsed.data.paid !== '0'
    if (!(await setRequestPaid(actor.id, parsed.data.requestId, paid))) {
      return errorState('Commande introuvable ou déjà mise à jour.')
    }
    revalidatePath('/admin', 'layout')
    return {
      status: 'success',
      message: paid ? 'Commande marquée comme réglée.' : 'Commande repassée en non réglée.',
    }
  })
}

export async function setRequestProcessedAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction('set-request-processed', formData, async () => {
    const actor = await requirePermission('requests:manage')
    const parsed = requestIdSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Action invalide.')
    const processed = parsed.data.processed !== '0'
    if (!(await setRequestProcessed(actor.id, parsed.data.requestId, processed))) {
      return errorState('Commande introuvable ou déjà mise à jour.')
    }
    revalidatePath('/admin', 'layout')
    return {
      status: 'success',
      message: processed ? 'Commande marquée comme traitée.' : 'Commande repassée en non traitée.',
    }
  })
}

export async function deleteRequestAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('delete-request', formData, async () => {
    const actor = await requirePermission('requests:manage')
    const parsed = requestIdSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Action invalide.')
    if (!(await deleteRequest(actor.id, parsed.data.requestId))) return errorState('Commande introuvable.')
    revalidatePath('/admin', 'layout')
    return { status: 'success', message: 'Commande supprimée.' }
  })
}
