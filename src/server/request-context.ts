import 'server-only'
import { headers } from 'next/headers'
import { env } from '@/server/env'

/**
 * Adresse IP du client, utilisée uniquement pour la limitation de débit.
 * Les en-têtes de proxy ne sont pris en compte que si TRUST_PROXY=true ; on retient
 * alors `X-Real-IP` ou la dernière entrée de `X-Forwarded-For` (celle ajoutée par
 * notre propre reverse proxy, que le client ne peut pas falsifier).
 */
export async function getClientIp(): Promise<string> {
  if (!env.TRUST_PROXY) return 'direct'
  const h = await headers()
  const realIp = h.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const forwarded = h
    .get('x-forwarded-for')
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return forwarded?.at(-1) ?? 'unknown'
}

export async function getUserAgent(): Promise<string | null> {
  const userAgent = (await headers()).get('user-agent')
  return userAgent ? userAgent.slice(0, 255) : null
}

export async function getRequestId(): Promise<string | null> {
  return (await headers()).get('x-request-id')
}
