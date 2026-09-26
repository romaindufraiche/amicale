import { NextResponse, type NextRequest } from 'next/server'
import { recordAudit } from '@/features/audit/service'
import { can } from '@/server/auth/permissions'
import { getCurrentSession } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { parseAdminOrderFilters } from '@/features/orders/filters'
import { ORDER_STATUS } from '@/features/orders/labels'
import { exportOrdersForAdmin } from '@/features/orders/queries'
import { formatOrderReference } from '@/features/orders/rules'
import { toCsv } from '@/lib/csv'
import { formatShortDate, parisDay } from '@/lib/dates'

/** Export CSV des commandes filtrées (pour la préparation des billets et la comptabilité). */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession()
  if (!session || session.user.status !== 'ACTIVE' || !can(session.user.role, 'orders:manage')) {
    return new NextResponse('Introuvable', { status: 404 })
  }

  const filters = parseAdminOrderFilters(Object.fromEntries(request.nextUrl.searchParams))
  const rows = await exportOrdersForAdmin(filters)
  await recordAudit(db, {
    actorId: session.user.id,
    action: 'orders.exported',
    entityType: 'order',
    entityId: 'export',
    details: { count: rows.length },
  })

  const csv = toCsv(
    [
      'Référence',
      'Date',
      'Statut',
      'Offre',
      'Détail',
      'Montant (€)',
      'Nom',
      'Prénom',
      'N° adhérent',
      'Email',
      'Téléphone',
    ],
    rows.map((order) => [
      formatOrderReference(order.number),
      formatShortDate(order.createdAt),
      ORDER_STATUS[order.status].label,
      order.offerTitle,
      order.lines.map((line) => `${line.quantity} × ${line.label}`).join(', '),
      (order.totalCents / 100).toFixed(2).replace('.', ','),
      order.memberLastName,
      order.memberFirstName,
      order.memberNumber,
      order.memberEmail,
      order.memberPhone,
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
