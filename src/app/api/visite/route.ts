import { NextResponse, type NextRequest } from 'next/server'
import { recordVisit } from '@/features/visits/service'
import { logger } from '@/server/logger'
import { getClientIp, getUserAgent } from '@/server/request-context'

export const dynamic = 'force-dynamic'

/** Compteur de visites : appelé par le navigateur à l'ouverture d'une page du site public. */
export async function POST(request: NextRequest) {
  // Seules les pages du site lui-même peuvent signaler une visite.
  if (request.headers.get('sec-fetch-site') !== 'same-origin') {
    return new NextResponse(null, { status: 204 })
  }
  try {
    await recordVisit(await getClientIp(), await getUserAgent())
  } catch (error) {
    logger.warn('visit.record_failed', { error })
  }
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
