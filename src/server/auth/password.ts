import 'server-only'
import { hash, verify } from '@node-rs/argon2'

// Argon2id, paramètres recommandés par l'OWASP (19 Mio, 2 itérations).
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS)
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}

let dummyHash: Promise<string> | undefined

/**
 * Vérifie le mot de passe contre une empreinte factice lorsque le compte n'existe pas,
 * pour que le temps de réponse ne révèle pas quelles adresses sont inscrites.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword('dummy-password-for-timing-equalization')
  await verifyPassword(await dummyHash, password)
  return false
}
