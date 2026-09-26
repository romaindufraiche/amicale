import 'server-only'
import { unstable_rethrow } from 'next/navigation'
import { errorState, type FormState } from '@/lib/form-state'
import { logger } from '@/server/logger'

/**
 * Enveloppe commune des actions serveur : une erreur inattendue est journalisée
 * avec son contexte et l'utilisateur reçoit un message compréhensible, sans détail technique.
 * Les interruptions de Next.js (redirect, notFound) sont propagées normalement.
 */
export async function runFormAction(
  name: string,
  formData: FormData,
  handler: () => Promise<FormState>,
): Promise<FormState> {
  try {
    return await handler()
  } catch (error) {
    unstable_rethrow(error)
    logger.error('action.failed', { action: name, error })
    return errorState(
      'Une erreur inattendue est survenue. Réessayez dans quelques instants ; si le problème persiste, contactez le bureau.',
      formData,
    )
  }
}
