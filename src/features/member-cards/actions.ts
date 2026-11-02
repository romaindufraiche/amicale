'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getSiteSettings } from '@/features/settings/queries'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { memberCardSchema } from './schemas'
import { deleteMember, issueMemberCard } from './service'

/** Crée la carte d'un adhérent (nouveau numéro) ou la renouvelle pour la saison en cours. */
export async function issueCardAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('issue-card', formData, async () => {
    const actor = await requirePermission('cards:generate')
    const parsed = memberCardSchema.safeParse({
      lastName: formData.get('lastName') ?? '',
      firstName: formData.get('firstName') ?? '',
    })
    if (!parsed.success) return validationError(parsed.error, formData)
    const { cardSeason } = await getSiteSettings()
    const { member, created } = await issueMemberCard(actor.id, parsed.data, cardSeason)
    revalidatePath('/admin/cartes')
    redirect(`/admin/cartes?carte=${member.id}&${created ? 'nouvelle' : 'renouvelee'}=1`)
  })
}

export async function deleteMemberAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('delete-member', formData, async () => {
    const actor = await requirePermission('cards:generate')
    const id = z.uuid().safeParse(formData.get('memberId'))
    if (!id.success || !(await deleteMember(actor.id, id.data))) return errorState('Adhérent introuvable.')
    revalidatePath('/admin/cartes')
    return { status: 'success', message: 'Adhérent retiré du listing.' }
  })
}
