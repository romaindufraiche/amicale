'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { errorState, type FormState } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requireActiveMember } from '@/server/auth/guards'
import { notifyOrder } from './notifications'
import { orderIdSchema, parseOrderForm } from './schemas'
import { cancelOwnOrder, createOrder, OrderError } from './service'

export async function createOrderAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('create-order', formData, async () => {
    const user = await requireActiveMember()
    const parsed = parseOrderForm(formData)
    if (!parsed.success)
      return errorState('Votre sélection est invalide. Vérifiez les quantités saisies.', formData)

    let result: { orderId: string; created: boolean }
    try {
      result = await createOrder({ userId: user.id, ...parsed.data })
    } catch (error) {
      if (error instanceof OrderError) return errorState(error.message, formData)
      throw error
    }

    if (result.created) await notifyOrder(result.orderId, 'created')
    revalidatePath('/espace', 'layout')
    redirect(`/espace/commandes/${result.orderId}?confirmee=1`)
  })
}

export async function cancelOwnOrderAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('cancel-own-order', formData, async () => {
    const user = await requireActiveMember()
    const orderId = orderIdSchema.safeParse(formData.get('orderId'))
    if (!orderId.success) return errorState('Commande introuvable.')

    const result = await cancelOwnOrder(user.id, orderId.data)
    if (!result.ok) return errorState(result.message)
    await notifyOrder(orderId.data, 'status_changed')
    revalidatePath('/espace', 'layout')
    return { status: 'success', message: 'Votre commande a été annulée.' }
  })
}
