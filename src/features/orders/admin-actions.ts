'use server'

import { revalidatePath } from 'next/cache'
import { errorState, type FormState } from '@/lib/form-state'
import { runFormAction } from '@/server/action'
import { requirePermission } from '@/server/auth/guards'
import { notifyOrder } from './notifications'
import { changeOrderStatusSchema } from './schemas'
import { changeOrderStatus } from './service'
import { formatOrderReference } from './rules'
import { ORDER_STATUS } from './labels'

export async function changeOrderStatusAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('change-order-status', formData, async () => {
    const actor = await requirePermission('orders:manage')
    const parsed = changeOrderStatusSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return errorState('Action invalide.')

    const result = await changeOrderStatus(actor.id, parsed.data.orderId, parsed.data.status)
    if (!result.ok) return errorState(result.message)

    await notifyOrder(parsed.data.orderId, 'status_changed')
    revalidatePath('/admin', 'layout')
    return {
      status: 'success',
      message: `Commande ${formatOrderReference(result.number)} : ${ORDER_STATUS[parsed.data.status].label.toLowerCase()}. L'adhérent a été prévenu.`,
    }
  })
}
