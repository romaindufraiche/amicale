import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/server/env'

/*
 * Lien personnel envoyé à un adhérent : /carte/<jeton>. Le jeton ne contient que
 * l'identifiant de l'adhérent et une date d'expiration, signés par le serveur ; la carte
 * est relue dans le listing à chaque ouverture (un adhérent retiré n'a plus de carte).
 */

/** Durée de validité d'un lien. */
const LINK_TTL_MS = 400 * 24 * 60 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Secret des liens adhérents, ou `null` si la fonction n'est pas activée sur ce serveur. */
export function memberLinkSecret(): string | null {
  return env.WALLET_LINK_SECRET ?? null
}

const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest('base64url')

export function createMemberToken(memberId: string, secret: string, now = Date.now()) {
  const data = Buffer.from(JSON.stringify({ m: memberId, e: now + LINK_TTL_MS })).toString('base64url')
  return `${data}.${sign(data, secret)}`
}

/** Identifiant de l'adhérent si le jeton (donnée externe, non fiable) est authentique et valide. */
export function readMemberToken(token: string, secret: string, now = Date.now()): string | null {
  if (token.length > 300) return null
  const [data, signature, extra] = token.split('.')
  if (!data || !signature || extra !== undefined) return null
  const expected = Buffer.from(sign(data, secret))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  try {
    const raw: unknown = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    if (!raw || typeof raw !== 'object') return null
    const { m, e } = raw as Record<string, unknown>
    if (typeof m !== 'string' || !UUID.test(m) || typeof e !== 'number' || e < now) return null
    return m
  } catch {
    return null
  }
}

export function memberLinkUrl(memberId: string, secret: string) {
  return `${env.APP_URL}/carte/${createMemberToken(memberId, secret)}`
}
