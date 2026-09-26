import 'server-only'
import { createHash, randomBytes } from 'node:crypto'

/** Jeton aléatoire de 256 bits, sûr pour une URL ou un cookie. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Seule l'empreinte des jetons est stockée : une fuite de la base ne permet
 * ni d'usurper une session ni d'utiliser un lien de réinitialisation.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
