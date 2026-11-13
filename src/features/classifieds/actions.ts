'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { logger } from '@/server/logger'
import { formatRetryAfter } from '@/server/rate-limit'
import { getClientIp } from '@/server/request-context'
import { classifiedInterestSchema, classifiedSchema } from './schemas'
import {
  deleteClassified,
  deleteInterest,
  saveClassified,
  setInterestProcessed,
  submitClassifiedInterest,
} from './service'

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

/** « Cette annonce m'intéresse » (visiteur). */
export async function submitClassifiedInterestAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction('classified-interest', formData, async () => {
    const parsed = classifiedInterestSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
      // Robot détecté par le champ piège : rien n'est enregistré.
      if (parsed.error.issues.some((issue) => issue.path[0] === 'website')) {
        logger.warn('classified_interest.honeypot')
        return { status: 'success', message: 'Demande envoyée.' }
      }
      return validationError(parsed.error, formData)
    }
    const { website: _honeypot, ...input } = parsed.data
    const result = await submitClassifiedInterest(input, await getClientIp())
    if (!result.ok) {
      return errorState(
        result.reason === 'RATE_LIMITED'
          ? `Vous avez envoyé plusieurs demandes récemment. Réessayez ${formatRetryAfter(result.retryAfterSeconds)}.`
          : 'Cette annonce n’est plus disponible.',
        formData,
      )
    }
    revalidatePath('/admin/annonces', 'layout')
    return { status: 'success', message: 'Demande envoyée.' }
  })
}

const interestSchema = z.object({ interestId: z.uuid(), processed: z.enum(['0', '1']).optional() })

export async function setInterestProcessedAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction('set-interest-processed', formData, async () => {
    const actor = await requirePermission('classifieds:manage')
    const parsed = interestSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Action invalide.')
    const processed = parsed.data.processed !== '0'
    if (!(await setInterestProcessed(actor.id, parsed.data.interestId, processed))) {
      return errorState('Demande introuvable ou déjà mise à jour.')
    }
    revalidatePath('/admin', 'layout')
    return {
      status: 'success',
      message: processed ? 'Demande marquée comme traitée.' : 'Demande repassée à traiter.',
    }
  })
}

export async function deleteInterestAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('delete-interest', formData, async () => {
    const actor = await requirePermission('classifieds:manage')
    const parsed = interestSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success || !(await deleteInterest(actor.id, parsed.data.interestId))) {
      return errorState('Demande introuvable.')
    }
    revalidatePath('/admin', 'layout')
    return { status: 'success', message: 'Demande supprimée.' }
  })
}
