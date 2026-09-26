'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { type MemberOutcome } from './labels'
import { approveMemberSchema, changeRoleSchema, memberIdSchema, renewMembershipSchema } from './schemas'
import {
  approveMember,
  changeMemberRole,
  rejectMember,
  renewMembership,
  setMemberSuspended,
  type MemberActionResult,
} from './service'

/**
 * Décisions qui changent le statut du compte : la section d'action disparaît de la page,
 * le résultat est donc affiché par la fiche elle-même après redirection.
 */
function redirectWithOutcome(result: MemberActionResult, userId: string, outcome: MemberOutcome): FormState {
  if (!result.ok) return errorState(result.message)
  revalidatePath('/admin', 'layout')
  redirect(`/admin/adherents/${userId}?resultat=${outcome}`)
}

function toState(result: MemberActionResult, success: string, userId: string): FormState {
  if (!result.ok) return errorState(result.message)
  revalidatePath('/admin', 'layout')
  revalidatePath(`/admin/adherents/${userId}`)
  return { status: 'success', message: success }
}

export async function approveMemberAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('approve-member', formData, async () => {
    const actor = await requirePermission('members:manage')
    const parsed = approveMemberSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)
    const result = await approveMember(actor.id, parsed.data.userId, parsed.data.membershipValidUntil)
    return redirectWithOutcome(result, parsed.data.userId, 'validee')
  })
}

export async function rejectMemberAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('reject-member', formData, async () => {
    const actor = await requirePermission('members:manage')
    const parsed = memberIdSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Adhérent introuvable.')
    const result = await rejectMember(actor.id, parsed.data.userId)
    return redirectWithOutcome(result, parsed.data.userId, 'refusee')
  })
}

export async function suspendMemberAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('suspend-member', formData, async () => {
    const actor = await requirePermission('members:manage')
    const parsed = memberIdSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Adhérent introuvable.')
    const suspend = formData.get('suspend') === 'true'
    const result = await setMemberSuspended(actor.id, parsed.data.userId, suspend)
    return toState(
      result,
      suspend ? 'Compte suspendu et sessions fermées.' : 'Compte réactivé.',
      parsed.data.userId,
    )
  })
}

export async function renewMembershipAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('renew-membership', formData, async () => {
    const actor = await requirePermission('members:manage')
    const parsed = renewMembershipSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)
    const result = await renewMembership(actor.id, parsed.data.userId, parsed.data.membershipValidUntil)
    return toState(result, 'Date de fin de cotisation mise à jour.', parsed.data.userId)
  })
}

export async function changeRoleAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('change-role', formData, async () => {
    const actor = await requirePermission('members:roles')
    const parsed = changeRoleSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)
    const result = await changeMemberRole(actor.id, parsed.data.userId, parsed.data.role)
    return toState(result, 'Rôle modifié. La personne devra se reconnecter.', parsed.data.userId)
  })
}
