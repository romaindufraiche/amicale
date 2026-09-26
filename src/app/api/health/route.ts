import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/server/db/client'
import { logger } from '@/server/logger'

export const dynamic = 'force-dynamic'

/** Sonde de disponibilité (load balancer, supervision) : vérifie l'accès à la base. */
export async function GET() {
  try {
    await db.execute(sql`select 1`)
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    logger.error('health.database_unreachable', { error })
    return NextResponse.json({ status: 'error' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
