import 'server-only'
import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { site } from '@/config/site'
import { recordAudit } from '@/features/audit/service'
import { PAGE_SIZE } from '@/lib/pagination'
import { formatDate } from '@/lib/dates'
import { revokeUserSessions } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { orders, users, type UserRole, type UserStatus } from '@/server/db/schema'
import { env } from '@/server/env'
import { sendEmail } from '@/server/mail/transport'
import { formatMemberNumber } from './membership'

export type MemberActionResult = { ok: true } | { ok: false; message: string }

const STALE = { ok: false, message: 'Ce compte a changé de statut entre-temps. Rechargez la page.' } as const

// ─── Espace adhérent ────────────────────────────────────────────────────────

export async function getOwnProfile(userId: string) {
  const [row] = await db
    .select({
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      category: users.category,
      assignment: users.assignment,
      memberNumber: users.memberNumber,
      membershipValidUntil: users.membershipValidUntil,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return row ?? null
}

export async function updateOwnProfile(
  userId: string,
  data: { phone: string | null; assignment: string | null },
) {
  await db.update(users).set(data).where(eq(users.id, userId))
}

// ─── Back-office : consultation ─────────────────────────────────────────────

export type MemberFilters = { status?: UserStatus; search?: string }

function memberWhere(filters: MemberFilters): SQL | undefined {
  const search = filters.search?.trim()
  const pattern = search ? `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%` : null
  return and(
    filters.status ? eq(users.status, filters.status) : undefined,
    pattern
      ? or(
          ilike(users.lastName, pattern),
          ilike(users.firstName, pattern),
          ilike(users.email, pattern),
          ilike(users.memberNumber, pattern),
        )
      : undefined,
  )
}

export async function listMembers(filters: MemberFilters, page: number) {
  const where = memberWhere(filters)
  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        category: users.category,
        status: users.status,
        role: users.role,
        memberNumber: users.memberNumber,
        membershipValidUntil: users.membershipValidUntil,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(sql`case when ${users.status} = 'PENDING_APPROVAL' then 0 else 1 end`, desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(users).where(where),
  ])
  return { rows, total: total?.value ?? 0 }
}

export async function getMemberForAdmin(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      category: users.category,
      assignment: users.assignment,
      role: users.role,
      status: users.status,
      emailVerifiedAt: users.emailVerifiedAt,
      memberNumber: users.memberNumber,
      membershipValidUntil: users.membershipValidUntil,
      reviewedAt: users.reviewedAt,
      createdAt: users.createdAt,
      ordersCount: sql<number>`(select count(*)::int from ${orders} where ${orders.userId} = ${users.id})`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return row ?? null
}

export async function countMembersByStatus(): Promise<Record<UserStatus, number>> {
  const rows = await db.select({ status: users.status, value: count() }).from(users).groupBy(users.status)
  const result: Record<UserStatus, number> = {
    PENDING_VERIFICATION: 0,
    PENDING_APPROVAL: 0,
    ACTIVE: 0,
    SUSPENDED: 0,
    REJECTED: 0,
  }
  for (const row of rows) result[row.status] = row.value
  return result
}

// ─── Back-office : décisions ────────────────────────────────────────────────

/** Valide une demande : attribue un numéro d'adhérent et une date de fin de cotisation. */
export async function approveMember(
  actorId: string,
  userId: string,
  validUntil: string,
): Promise<MemberActionResult> {
  const approved = await db.transaction(async (tx) => {
    const [member] = await tx
      .select({
        status: users.status,
        memberNumber: users.memberNumber,
        email: users.email,
        firstName: users.firstName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .for('update')
    if (!member || member.status !== 'PENDING_APPROVAL') return null

    let memberNumber = member.memberNumber
    if (!memberNumber) {
      const [seq] = await tx.execute<{ value: number }>(
        sql`select nextval('member_number_seq')::int as value`,
      )
      if (!seq) throw new Error('Séquence member_number_seq indisponible')
      memberNumber = formatMemberNumber(new Date().getFullYear(), seq.value)
    }
    await tx
      .update(users)
      .set({
        status: 'ACTIVE',
        memberNumber,
        membershipValidUntil: validUntil,
        reviewedAt: new Date(),
        reviewedById: actorId,
      })
      .where(eq(users.id, userId))
    await recordAudit(tx, {
      actorId,
      action: 'member.approved',
      entityType: 'user',
      entityId: userId,
      details: { memberNumber, membershipValidUntil: validUntil },
    })
    return member
  })
  if (!approved) return STALE

  await sendEmail(approved.email, {
    subject: 'Votre adhésion est validée',
    paragraphs: [
      `Bonjour ${approved.firstName},`,
      `Le bureau a validé votre adhésion à l'${site.legalName}. Bienvenue !`,
      `Votre adhésion est valable jusqu'au ${formatDate(validUntil)}. Vous avez désormais accès à la billetterie, aux sorties et aux avantages partenaires.`,
    ],
    action: { label: 'Accéder à mon espace', url: `${env.APP_URL}/espace` },
  })
  return { ok: true }
}

export async function rejectMember(actorId: string, userId: string): Promise<MemberActionResult> {
  const rejected = await db.transaction(async (tx) => {
    const [member] = await tx
      .update(users)
      .set({ status: 'REJECTED', reviewedAt: new Date(), reviewedById: actorId })
      .where(and(eq(users.id, userId), eq(users.status, 'PENDING_APPROVAL')))
      .returning({ email: users.email, firstName: users.firstName })
    if (!member) return null
    await recordAudit(tx, { actorId, action: 'member.rejected', entityType: 'user', entityId: userId })
    return member
  })
  if (!rejected) return STALE
  await revokeUserSessions(userId)
  await sendEmail(rejected.email, {
    subject: "Votre demande d'adhésion",
    paragraphs: [
      `Bonjour ${rejected.firstName},`,
      `Le bureau de l'${site.legalName} n'a pas pu donner suite à votre demande d'adhésion.`,
      'Si vous pensez qu’il s’agit d’une erreur, vous pouvez contacter le bureau via le formulaire de contact du site.',
    ],
    action: { label: 'Contacter le bureau', url: `${env.APP_URL}/contact` },
  })
  return { ok: true }
}

export async function setMemberSuspended(
  actorId: string,
  userId: string,
  suspended: boolean,
): Promise<MemberActionResult> {
  if (actorId === userId) return { ok: false, message: 'Vous ne pouvez pas suspendre votre propre compte.' }
  const done = await db.transaction(async (tx) => {
    const [member] = await tx
      .update(users)
      .set({ status: suspended ? 'SUSPENDED' : 'ACTIVE' })
      .where(and(eq(users.id, userId), eq(users.status, suspended ? 'ACTIVE' : 'SUSPENDED')))
      .returning({ id: users.id })
    if (!member) return false
    await recordAudit(tx, {
      actorId,
      action: suspended ? 'member.suspended' : 'member.reactivated',
      entityType: 'user',
      entityId: userId,
    })
    return true
  })
  if (!done) return STALE
  if (suspended) await revokeUserSessions(userId)
  return { ok: true }
}

export async function renewMembership(
  actorId: string,
  userId: string,
  validUntil: string,
): Promise<MemberActionResult> {
  const done = await db.transaction(async (tx) => {
    const [member] = await tx
      .update(users)
      .set({ membershipValidUntil: validUntil })
      .where(and(eq(users.id, userId), eq(users.status, 'ACTIVE')))
      .returning({ id: users.id })
    if (!member) return false
    await recordAudit(tx, {
      actorId,
      action: 'member.membership_renewed',
      entityType: 'user',
      entityId: userId,
      details: { membershipValidUntil: validUntil },
    })
    return true
  })
  return done ? { ok: true } : STALE
}

export async function changeMemberRole(
  actorId: string,
  userId: string,
  role: UserRole,
): Promise<MemberActionResult> {
  if (actorId === userId) {
    return {
      ok: false,
      message: 'Vous ne pouvez pas modifier votre propre rôle : demandez à un autre administrateur.',
    }
  }
  const done = await db.transaction(async (tx) => {
    const [member] = await tx
      .select({ role: users.role, status: users.status })
      .from(users)
      .where(eq(users.id, userId))
      .for('update')
    if (!member || member.status !== 'ACTIVE') return false
    await tx.update(users).set({ role }).where(eq(users.id, userId))
    await recordAudit(tx, {
      actorId,
      action: 'member.role_changed',
      entityType: 'user',
      entityId: userId,
      details: { from: member.role, to: role },
    })
    return true
  })
  if (!done) return { ok: false, message: 'Seul un adhérent actif peut recevoir un rôle au bureau.' }
  // Les droits changent : les sessions ouvertes sont fermées par précaution.
  await revokeUserSessions(userId)
  return { ok: true }
}
