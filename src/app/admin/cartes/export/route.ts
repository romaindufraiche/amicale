import { NextResponse } from 'next/server'
import { recordAudit } from '@/features/audit/service'
import { formatMemberNumber } from '@/features/member-cards/schemas'
import { listMembers } from '@/features/member-cards/service'
import { toCsv } from '@/lib/csv'
import { formatShortDate, parisDay } from '@/lib/dates'
import { can } from '@/server/auth/permissions'
import { getCurrentSession } from '@/server/auth/session'
import { db } from '@/server/db/client'

/** Export CSV du listing des adhérents (ouvrable dans Excel). */
export async function GET() {
  const session = await getCurrentSession()
  if (!session || session.user.status !== 'ACTIVE' || !can(session.user.role, 'cards:generate')) {
    return new NextResponse('Introuvable', { status: 404 })
  }
  const members = await listMembers()
  await recordAudit(db, {
    actorId: session.user.id,
    action: 'members.exported',
    entityType: 'member',
    entityId: 'export',
    details: { count: members.length },
  })
  const csv = toCsv(
    ['N° d’adhérent', 'Nom', 'Prénom', 'Saison', 'Ajouté le', 'Dernière carte le'],
    [...members]
      .sort((a, b) => a.number - b.number)
      .map((member) => [
        formatMemberNumber(member.number),
        member.lastName.toLocaleUpperCase('fr-FR'),
        member.firstName,
        member.season,
        formatShortDate(member.createdAt),
        formatShortDate(member.updatedAt),
      ]),
  )
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="adherents-${parisDay()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
