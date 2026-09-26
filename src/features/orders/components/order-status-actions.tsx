'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import type { OrderStatus } from '@/server/db/schema'
import { changeOrderStatusAction } from '../admin-actions'
import { ORDER_ACTION_LABELS } from '../labels'

/**
 * Actions du bureau sur une commande. Un seul état par commande : le message de
 * confirmation reste affiché même si les boutons disponibles changent après l'action.
 */
export function OrderStatusActions({
  orderId,
  reference,
  transitions,
}: {
  orderId: string
  reference: string
  transitions: readonly OrderStatus[]
}) {
  const [state, formAction] = useActionState(changeOrderStatusAction, idleState)
  return (
    <form
      action={formAction}
      className="flex min-w-44 flex-col gap-2"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
        if (
          submitter?.value === 'CANCELLED' &&
          !window.confirm(
            `Annuler la commande ${reference} ? Les places seront remises en vente et l’adhérent prévenu.`,
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      {transitions.map((target) => (
        <SubmitButton
          key={target}
          name="status"
          value={target}
          variant={target === 'CANCELLED' ? 'danger' : 'secondary'}
          size="sm"
          className="self-start"
        >
          {ORDER_ACTION_LABELS[target]}
        </SubmitButton>
      ))}
      <FormMessage state={state} />
    </form>
  )
}
