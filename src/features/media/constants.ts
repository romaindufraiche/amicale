/** Contraintes de téléversement, partagées entre le navigateur (retour immédiat) et le serveur (contrôle réel). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
/** Taille maximale acceptée avant la réduction faite dans le navigateur (photo de téléphone). */
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function mediaUrl(id: string): string {
  return `/media/${id}`
}

/** Fichiers joints (PDF, ou photo JPEG) : envoyés tels quels, d'où la limite de la requête. */
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024
export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg'] as const

export function documentUrl(id: string): string {
  return `/media/fichiers/${id}`
}
