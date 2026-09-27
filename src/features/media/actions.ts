'use server'

import { unstable_rethrow } from 'next/navigation'
import { requirePermission } from '@/server/auth/guards'
import { logger } from '@/server/logger'
import { consumeRateLimit } from '@/server/rate-limit'
import { storeImage, type UploadResult } from './service'

/** Téléversement d'une image (glisser-déposer du back-office). */
export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  try {
    const actor = await requirePermission('media:upload')
    const limit = await consumeRateLimit(`upload:${actor.id}`, 60, 60 * 60 * 1000)
    if (!limit.allowed)
      return { ok: false, message: 'Trop d’images envoyées en peu de temps. Réessayez plus tard.' }

    const file = formData.get('file')
    if (!(file instanceof File)) return { ok: false, message: 'Aucun fichier reçu.' }
    return await storeImage(file, actor.id)
  } catch (error) {
    unstable_rethrow(error)
    logger.error('action.failed', { action: 'upload-image', error })
    return { ok: false, message: 'L’envoi a échoué. Réessayez dans quelques instants.' }
  }
}
