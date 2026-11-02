import 'server-only'
import { consumeRateLimit } from '@/server/rate-limit'
import { getClientIp } from '@/server/request-context'
import { memberLinkSecret, readMemberToken } from './member-link'
import { getMember } from './service'

/**
 * Adhérent désigné par un lien personnel (jeton non fiable, vérifié), ou `null`.
 * Les ouvertures sont limitées par adresse IP pour décourager les essais en série.
 */
export async function memberFromLink(token: string) {
  const secret = memberLinkSecret()
  if (!secret) return null
  const limit = await consumeRateLimit(`member-link:ip:${await getClientIp()}`, 60, 60 * 60 * 1000)
  if (!limit.allowed) return null
  let decoded: string
  try {
    decoded = decodeURIComponent(token)
  } catch {
    return null
  }
  const memberId = readMemberToken(decoded, secret)
  return memberId ? getMember(memberId) : null
}
