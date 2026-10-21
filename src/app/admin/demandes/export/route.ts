import { NextResponse, type NextRequest } from 'next/server'
import { recordAudit } from '@/features/audit/service'
import { exportRequestsForAdmin } from '@/features/requests/queries'
import { parseRequestFilters } from '@/features/requests/schemas'
import { formatRequestLines, requestTotalCents } from '@/features/requests/service'
import { can } from '@/server/auth/permissions'
import { getCurrentSession } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { toCsv } from '@/lib/csv'
import { formatShortDate, parisDay } from '@/lib/dates'

/** Export CSV des commandes filtrées. */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession()
  if (!session || session.user.status !== 'ACTIVE' || !can(session.user.role, 'requests:manage')) {
    return new NextResponse('Introuvable', { status: 404 })
  }

  const filters = parseRequestFilters(Object.fromEntries(request.nextUrl.searchParams))
  const rows = await exportRequestsForAdmin(filters)
  await recordAudit(db, {
    actorId: session.user.id,
    action: 'offer_requests.exported',
    entityType: 'offer_request',
    entityId: 'export',
    details: { count: rows.length },
  })

  const csv = toCsv(
    [
      'Date',
      'Offre',
      'Billets',
      'Quantité',
      'Total (€)',
      'Nom',
      'Prénom',
      'Email',
      'Traitée le',
      'Réglée le',
    ],
    rows.map((row) => [
      formatShortDate(row.createdAt),
      row.offerTitle,
      formatRequestLines(row.lines),
      row.quantity,
      (() => {
        const total = requestTotalCents(row.lines)
        return total === null ? null : (total / 100).toFixed(2).replace('.', ',')
      })(),
      row.lastName,
      row.firstName,
      row.email,
      row.processedAt ? formatShortDate(row.processedAt) : null,
      row.paidAt ? formatShortDate(row.paidAt) : null,
    ]),
  )

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="commandes-${parisDay()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
