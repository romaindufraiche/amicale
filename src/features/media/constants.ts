/** Contraintes de téléversement, partagées entre le navigateur (retour immédiat) et le serveur (contrôle réel). */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function mediaUrl(id: string): string {
  return `/media/${id}`
}
