import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ActionForm } from '@/components/ui/action-form'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { TextField, SelectField } from '@/components/ui/fields'
import { MEMBER_CATEGORY_LABELS } from '@/features/members/categories'
import {
  approveMemberAction,
  changeRoleAction,
  rejectMemberAction,
  renewMembershipAction,
  suspendMemberAction,
} from '@/features/members/actions'
import { MEMBER_OUTCOMES, type MemberOutcome, USER_ROLE_LABELS, USER_STATUS } from '@/features/members/labels'
import { defaultMembershipEnd } from '@/features/members/membership'
import { getMemberForAdmin } from '@/features/members/service'
import { formatDate, formatDateTime, parisDay } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'
import { can } from '@/server/auth/permissions'

export const metadata: Metadata = { title: 'Fiche adhérent' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ resultat?: string }> }

const ROLE_OPTIONS = (['MEMBER', 'BUREAU', 'ADMIN'] as const).map((value) => ({
  value,
  label: USER_ROLE_LABELS[value],
}))

export default async function MemberPage({ params, searchParams }: Props) {
  const { id } = await params
  const actor = await requirePermission('members:manage', `/admin/adherents/${id}`)
  const memberId = z.uuid().safeParse(id)
  const member = memberId.success ? await getMemberForAdmin(memberId.data) : null
  if (!member) notFound()

  const { resultat } = await searchParams
  const outcome = resultat && resultat in MEMBER_OUTCOMES ? MEMBER_OUTCOMES[resultat as MemberOutcome] : null
  const today = parisDay()
  const status = USER_STATUS[member.status]
  const details = [
    { label: 'Adresse email', value: member.email },
    { label: 'Téléphone', value: member.phone ?? '—' },
    { label: 'Situation', value: MEMBER_CATEGORY_LABELS[member.category] },
    { label: 'Service d’affectation', value: member.assignment ?? '—' },
    { label: 'N° d’adhérent', value: member.memberNumber ?? '—' },
    {
      label: 'Fin de cotisation',
      value: member.membershipValidUntil ? formatDate(member.membershipValidUntil) : '—',
    },
    { label: 'Rôle', value: USER_ROLE_LABELS[member.role] },
    { label: 'Inscription', value: formatDateTime(member.createdAt) },
    {
      label: 'Email confirmé',
      value: member.emailVerifiedAt ? formatDateTime(member.emailVerifiedAt) : 'Non',
    },
    { label: 'Commandes', value: String(member.ordersCount) },
  ]

  return (
    <>
      <Link href="/admin/adherents" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Adhérents
      </Link>
      <header className="flex flex-col gap-3">
        <h1 className="text-h1">
          {member.firstName} {member.lastName}
        </h1>
        <Badge tone={status.tone} className="self-start">
          {status.label}
        </Badge>
      </header>
      {outcome ? <Alert tone="success" title={outcome} /> : null}

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <dl className="divide-y divide-line self-start border-y border-line">
          {details.map((item) => (
            <div key={item.label} className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr]">
              <dt className="text-ink-muted">{item.label}</dt>
              <dd className="font-semibold break-words">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-6">
          {member.status === 'PENDING_APPROVAL' ? (
            <section
              aria-labelledby="decision"
              className="flex flex-col gap-5 rounded-md bg-surface p-6 shadow-raised"
            >
              <h2 id="decision" className="text-h3">
                Décision sur la demande
              </h2>
              <ActionForm
                action={approveMemberAction}
                fields={{ userId: member.id }}
                label="Valider l’adhésion"
                variant="primary"
                size="md"
              >
                <TextField
                  name="membershipValidUntil"
                  type="date"
                  label="Cotisation valable jusqu’au"
                  required
                  min={today}
                  defaultValue={defaultMembershipEnd(today)}
                />
              </ActionForm>
              <div className="border-t border-line pt-5">
                <ActionForm
                  action={rejectMemberAction}
                  fields={{ userId: member.id }}
                  label="Refuser la demande"
                  variant="danger"
                  confirm="Refuser cette demande d’adhésion ? La personne en sera informée par email."
                />
              </div>
            </section>
          ) : null}

          {member.status === 'ACTIVE' ? (
            <section aria-labelledby="cotisation" className="flex flex-col gap-5 rounded-md bg-surface p-6">
              <h2 id="cotisation" className="text-h3">
                Cotisation
              </h2>
              <ActionForm action={renewMembershipAction} fields={{ userId: member.id }} label="Mettre à jour">
                <TextField
                  name="membershipValidUntil"
                  type="date"
                  label="Valable jusqu’au"
                  required
                  defaultValue={member.membershipValidUntil ?? defaultMembershipEnd(today)}
                />
              </ActionForm>
            </section>
          ) : null}

          {can(actor.role, 'members:roles') && member.status === 'ACTIVE' && member.id !== actor.id ? (
            <section aria-labelledby="role" className="flex flex-col gap-5 rounded-md bg-surface p-6">
              <h2 id="role" className="text-h3">
                Rôle
              </h2>
              <ActionForm action={changeRoleAction} fields={{ userId: member.id }} label="Modifier le rôle">
                <SelectField
                  name="role"
                  label="Accès"
                  hint="Le bureau gère adhérents, offres, commandes et contenus. L’administrateur gère aussi les rôles et consulte le journal."
                  required
                  options={ROLE_OPTIONS}
                  defaultValue={member.role}
                />
              </ActionForm>
            </section>
          ) : null}

          {(member.status === 'ACTIVE' || member.status === 'SUSPENDED') && member.id !== actor.id ? (
            <section aria-labelledby="acces" className="flex flex-col gap-4 rounded-md bg-surface p-6">
              <h2 id="acces" className="text-h3">
                Accès au compte
              </h2>
              {member.status === 'ACTIVE' ? (
                <ActionForm
                  action={suspendMemberAction}
                  fields={{ userId: member.id, suspend: 'true' }}
                  label="Suspendre le compte"
                  variant="danger"
                  confirm="Suspendre ce compte ? La personne sera déconnectée et ne pourra plus se connecter."
                />
              ) : (
                <ActionForm
                  action={suspendMemberAction}
                  fields={{ userId: member.id, suspend: 'false' }}
                  label="Réactiver le compte"
                />
              )}
            </section>
          ) : null}
        </div>
      </div>
    </>
  )
}
