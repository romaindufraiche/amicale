import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { Table, Td, Th } from '@/components/ui/table'
import { MEMBER_CATEGORY_LABELS } from '@/features/members/categories'
import { USER_ROLE_LABELS, USER_STATUS } from '@/features/members/labels'
import { listMembers } from '@/features/members/service'
import { formatShortDate } from '@/lib/dates'
import { pageCount, parsePage } from '@/lib/pagination'
import { requirePermission } from '@/server/auth/guards'
import { userStatus, type UserStatus } from '@/server/db/schema'

export const metadata: Metadata = { title: 'Adhérents' }

type Props = { searchParams: Promise<{ q?: string; statut?: string; page?: string }> }

const STATUS_OPTIONS = userStatus.enumValues.map((value) => ({ value, label: USER_STATUS[value].label }))

export default async function MembersPage({ searchParams }: Props) {
  await requirePermission('members:manage', '/admin/adherents')
  const params = await searchParams
  const status = (userStatus.enumValues as readonly string[]).includes(params.statut ?? '')
    ? (params.statut as UserStatus)
    : undefined
  const search = typeof params.q === 'string' ? params.q.slice(0, 100) : undefined
  const page = parsePage(params.page)
  const { rows, total } = await listMembers({ status, search }, page)

  const query = (target: number) => {
    const qs = new URLSearchParams()
    if (search) qs.set('q', search)
    if (status) qs.set('statut', status)
    qs.set('page', String(target))
    return `/admin/adherents?${qs}`
  }

  return (
    <>
      <PageHeader eyebrow="Espace bureau" title="Adhérents" lead={`${total} compte${total > 1 ? 's' : ''}`} />
      <FilterBar
        action="/admin/adherents"
        search={{ name: 'q', label: 'Rechercher (nom, email, n° d’adhérent)', value: search }}
        select={{ name: 'statut', label: 'Statut', value: status, options: STATUS_OPTIONS }}
        hasFilters={Boolean(search || status)}
      />
      {rows.length === 0 ? (
        <EmptyState title="Aucun compte ne correspond">Modifiez ou réinitialisez les filtres.</EmptyState>
      ) : (
        <>
          <Table caption="Liste des adhérents">
            <thead>
              <tr>
                <Th>Nom</Th>
                <Th>Situation</Th>
                <Th>N° adhérent</Th>
                <Th>Fin de cotisation</Th>
                <Th>Statut</Th>
                <Th>Inscription</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((member) => (
                <tr key={member.id} className="hover:bg-paper">
                  <Td>
                    <Link href={`/admin/adherents/${member.id}`} className="font-semibold link">
                      {member.lastName.toUpperCase()} {member.firstName}
                    </Link>
                    <span className="block text-ink-muted">{member.email}</span>
                    {member.role !== 'MEMBER' ? (
                      <span className="label-caps text-red-700">{USER_ROLE_LABELS[member.role]}</span>
                    ) : null}
                  </Td>
                  <Td>{MEMBER_CATEGORY_LABELS[member.category]}</Td>
                  <Td className="tabular">{member.memberNumber ?? '—'}</Td>
                  <Td className="tabular">
                    {member.membershipValidUntil ? formatShortDate(member.membershipValidUntil) : '—'}
                  </Td>
                  <Td>
                    <Badge tone={USER_STATUS[member.status].tone}>{USER_STATUS[member.status].label}</Badge>
                  </Td>
                  <Td className="tabular">{formatShortDate(member.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageCount={pageCount(total)} hrefFor={query} />
        </>
      )}
    </>
  )
}
