import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from './constants'

const MAX_DIMENSION = 2400

/**
 * Réduit une photo dans le navigateur avant l'envoi (une photo de téléphone dépasse
 * souvent 5 Mo). Le serveur ré-encode de toute façon l'image : cette étape ne sert
 * qu'à accélérer l'envoi et à respecter la taille maximale acceptée par l'hébergeur.
 */
export async function prepareImage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  for (const quality of [0.9, 0.8, 0.7]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
    }
  }
  return file
}

export function isAcceptedImage(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)
}
