import 'server-only'
import { eq, sql } from 'drizzle-orm'
import sharp, { type OutputInfo } from 'sharp'
import { db } from '@/server/db/client'
import { documents, media } from '@/server/db/schema'
import { logger } from '@/server/logger'
import {
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_UPLOAD_BYTES,
} from './constants'

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

/** Supprime les images et fichiers téléversés mais rattachés à aucun contenu (après 24 h). */
export async function purgeOrphanMedia(): Promise<number> {
  const images = await db.execute<{ id: string }>(sql`
    delete from media m
    where m.created_at < now() - interval '1 day'
      and not exists (select 1 from offers o where o.image_id = m.id)
      and not exists (select 1 from partners p where p.image_id = m.id)
      and not exists (select 1 from highlights h where h.image_id = m.id)
      and not exists (select 1 from news n where n.image_id = m.id)
    returning m.id`)
  const files = await db.execute<{ id: string }>(sql`
    delete from documents d
    where d.created_at < now() - interval '1 day'
      and not exists (select 1 from offers o where o.attachment_id = d.id)
      and not exists (select 1 from partners p where p.attachment_id = d.id)
    returning d.id`)
  return images.length + files.length
}

export type DocumentUploadResult =
  { ok: true; id: string; fileName: string; sizeBytes: number } | { ok: false; message: string }

/** Nom de fichier proposé au téléchargement : sans chemin ni caractère de contrôle, 100 caractères max. */
export function cleanFileName(name: string, extension: 'pdf' | 'jpg'): string {
  const base = name
    .replace(/^.*[\\/]/, '')
    .replace(/\.[^.]*$/, '')
    .replace(/[\u0000-\u001f"<>:|?*]/g, '')
    .trim()
    .slice(0, 100)
  return `${base || 'document'}.${extension}`
}

/**
 * Enregistre un fichier joint. Un PDF est vérifié par sa signature (`%PDF-`) ; une photo JPEG
 * est décodée puis ré-encodée (métadonnées supprimées). Tout autre contenu est rejeté.
 */
export async function storeDocument(file: File, actorId: string): Promise<DocumentUploadResult> {
  if (file.size === 0) return { ok: false, message: 'Le fichier est vide.' }
  if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, message: 'Fichier trop lourd : 4 Mo maximum.' }
  if (!(ACCEPTED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: 'Format non pris en charge : utilisez un fichier PDF ou JPEG.' }
  }

  const input = Buffer.from(await file.arrayBuffer())
  let data: Buffer
  let mimeType: 'application/pdf' | 'image/jpeg'
  let fileName: string
  if (file.type === 'application/pdf') {
    if (input.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return { ok: false, message: 'Ce fichier n’est pas un PDF valide.' }
    }
    data = input
    mimeType = 'application/pdf'
    fileName = cleanFileName(file.name, 'pdf')
  } else {
    try {
      data = await sharp(input, { limitInputPixels: 50_000_000 })
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer()
    } catch (error) {
      logger.warn('media.invalid_document', { error })
      return { ok: false, message: 'Ce fichier n’est pas une image JPEG lisible.' }
    }
    mimeType = 'image/jpeg'
    fileName = cleanFileName(file.name, 'jpg')
  }

  const [row] = await db
    .insert(documents)
    .values({ mimeType, fileName, data, sizeBytes: data.length, createdById: actorId })
    .returning({ id: documents.id })
  if (!row) throw new Error('Insertion de document sans retour')
  logger.info('document.stored', { documentId: row.id, sizeBytes: data.length })
  return { ok: true, id: row.id, fileName, sizeBytes: data.length }
}

export async function getDocument(id: string) {
  const [row] = await db
    .select({ mimeType: documents.mimeType, fileName: documents.fileName, data: documents.data })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1)
  return row ?? null
}

/** Nom et taille d'un fichier joint, pour l'afficher sans charger son contenu. */
export async function getDocumentInfo(id: string | null) {
  if (!id) return null
  const [row] = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      sizeBytes: documents.sizeBytes,
      mimeType: documents.mimeType,
    })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1)
  return row ?? null
}

export type DocumentInfo = NonNullable<Awaited<ReturnType<typeof getDocumentInfo>>>
