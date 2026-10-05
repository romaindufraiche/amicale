'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { logger } from '@/server/logger'
import { formatRetryAfter } from '@/server/rate-limit'
import { getClientIp } from '@/server/request-context'
import { offerRequestSchema } from './schemas'
import { deleteRequest, setRequestPaid, submitOfferRequest } from './service'

/** État de succès : `paymentUrl` vide si l'offre n'a pas encore de page HelloAsso. */
export type OfferRequestState = FormState & { paymentUrl?: string | null }

export async function submitOfferRequestAction(
  _previous: OfferRequestState,
  formData: FormData,
): Promise<OfferRequestState> {
  return runFormAction('offer-request', formData, async () => {
    const parsed = offerRequestSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
      // Robot détecté par le champ piège : rien n'est enregistré.
      if (parsed.error.issues.some((issue) => issue.path[0] === 'website')) {
        logger.warn('offer_request.honeypot')
        return { status: 'success', message: 'Commande envoyée.', paymentUrl: null }
      }
      return validationError(parsed.error, formData)
    }
    const { website: _honeypot, ...input } = parsed.data
    const result = await submitOfferRequest(input, await getClientIp())
    if (!result.ok) {
      return errorState(
        result.reason === 'RATE_LIMITED'
          ? `Vous avez envoyé plusieurs commandes récemment. Réessayez ${formatRetryAfter(result.retryAfterSeconds)}.`
          : 'Cette offre n’est plus disponible à la commande.',
        formData,
      )
    }
    revalidatePath('/admin', 'layout')
    return { status: 'success', message: 'Commande envoyée.', paymentUrl: result.helloassoUrl }
  })
}

const requestIdSchema = z.object({ requestId: z.uuid(), paid: z.enum(['0', '1']).optional() })

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
