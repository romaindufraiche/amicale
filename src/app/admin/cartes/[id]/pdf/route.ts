import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { recordAudit } from '@/features/audit/service'
import { cardFileName } from '@/features/member-cards/files'
import { buildMemberCardPdf } from '@/features/member-cards/pdf'
import { CARD_LAYOUTS } from '@/features/member-cards/schemas'
import { getMember } from '@/features/member-cards/service'
import { can } from '@/server/auth/permissions'
import { getCurrentSession } from '@/server/auth/session'
import { db } from '@/server/db/client'

type Context = { params: Promise<{ id: string }> }

/** PDF de la carte d'un adhérent du listing (réservé au bureau). */
export async function GET(request: NextRequest, { params }: Context) {
  const session = await getCurrentSession()
  if (!session || session.user.status !== 'ACTIVE' || !can(session.user.role, 'cards:generate')) {
    return new NextResponse('Introuvable', { status: 404 })
  }
  const id = z.uuid().safeParse((await params).id)
  const member = id.success ? await getMember(id.data) : null
  if (!member) return new NextResponse('Introuvable', { status: 404 })
  const layout = CARD_LAYOUTS.find((value) => value === request.nextUrl.searchParams.get('format')) ?? 'carte'

  const pdf = await buildMemberCardPdf(member, member.season, layout)
  await recordAudit(db, {
    actorId: session.user.id,
    action: 'member_card.generated',
    entityType: 'member',
    entityId: member.id,
    details: { number: member.number, format: layout },
  })
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${cardFileName(member, layout === 'a4' ? '-a4' : '')}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
