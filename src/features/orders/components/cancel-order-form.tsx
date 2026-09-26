'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { cancelOwnOrderAction } from '../actions'

export function CancelOrderForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(cancelOwnOrderAction, idleState)
  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        if (!window.confirm('Annuler cette commande ? Les places seront remises en vente.'))
          event.preventDefault()
      }}
    >
      <FormMessage state={state} />
      <input type="hidden" name="orderId" value={orderId} />
      {state.status !== 'success' ? (
        <SubmitButton variant="danger" size="sm" pendingLabel="Annulation…" className="self-start">
          Annuler la commande
        </SubmitButton>
      ) : null}
    </form>
  )
}
