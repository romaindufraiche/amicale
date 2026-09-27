import 'server-only'
import { eq, sql } from 'drizzle-orm'
import sharp, { type OutputInfo } from 'sharp'
import { db } from '@/server/db/client'
import { media } from '@/server/db/schema'
import { logger } from '@/server/logger'
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from './constants'

const MAX_DIMENSION = 1600

export type UploadResult =
  { ok: true; id: string; width: number; height: number } | { ok: false; message: string }

/**
 * Enregistre une image téléversée par le bureau.
 * Le fichier n'est jamais stocké tel quel : il est décodé puis ré-encodé en WebP
 * (1600 px max). Un fichier qui n'est pas une vraie image est rejeté, et les
 * métadonnées (EXIF, position GPS d'une photo de téléphone…) sont supprimées.
 */
export async function storeImage(file: File, actorId: string): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, message: 'Le fichier est vide.' }
  if (file.size > MAX_UPLOAD_BYTES)
    return { ok: false, message: 'Image trop lourde : 4 Mo maximum après réduction.' }
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: 'Format non pris en charge : utilisez une image JPEG, PNG ou WebP.' }
  }

  let output: { data: Buffer; info: OutputInfo }
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate() // applique l'orientation EXIF avant de supprimer les métadonnées
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
  } catch (error) {
    logger.warn('media.invalid_image', { error })
    return { ok: false, message: 'Ce fichier n’est pas une image lisible.' }
  }

  const [row] = await db
    .insert(media)
    .values({
      mimeType: 'image/webp',
      data: output.data,
      width: output.info.width,
      height: output.info.height,
      sizeBytes: output.info.size,
      createdById: actorId,
    })
    .returning({ id: media.id })
  if (!row) throw new Error('Insertion de média sans retour')
  logger.info('media.stored', { mediaId: row.id, sizeBytes: output.info.size })
  return { ok: true, id: row.id, width: output.info.width, height: output.info.height }
}

export async function getMedia(id: string) {
  const [row] = await db
    .select({ mimeType: media.mimeType, data: media.data })
    .from(media)
    .where(eq(media.id, id))
    .limit(1)
  return row ?? null
}

/** Supprime les images téléversées mais rattachées à aucun contenu (après 24 h). */
export async function purgeOrphanMedia(): Promise<number> {
  const deleted = await db.execute<{ id: string }>(sql`
    delete from media m
    where m.created_at < now() - interval '1 day'
      and not exists (select 1 from offers o where o.image_id = m.id)
      and not exists (select 1 from highlights h where h.image_id = m.id)
      and not exists (select 1 from news n where n.image_id = m.id)
    returning m.id`)
  return deleted.length
}
