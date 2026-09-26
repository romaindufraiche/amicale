'use client'

import { useActionState, useState } from 'react'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { formatEuros } from '@/lib/money'
import { createOrderAction } from '../actions'
import { MAX_QUANTITY_PER_LINE } from '../schemas'

export type OrderFormTariff = {
  id: string
  label: string
  memberPriceCents: number
  publicPriceCents: number | null
  stock: number | null
}

type OrderFormProps = {
  offerId: string
  idempotencyKey: string
  tariffs: OrderFormTariff[]
  /** Quantité encore autorisée pour cet adhérent (null = sans limite). */
  remainingAllowance: number | null
}

/**
 * Sélection des billets. Le total affiché n'est qu'indicatif : le serveur recalcule
 * la commande à partir des tarifs en base et vérifie stock et limites.
 */
export function OrderForm({ offerId, idempotencyKey, tariffs, remainingAllowance }: OrderFormProps) {
  const [state, formAction] = useActionState(createOrderAction, idleState)
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      tariffs.map((tariff) => [tariff.id, Number(state.values?.[`qty_${tariff.id}`] ?? 0) || 0]),
    ),
  )

  const totalQuantity = Object.values(quantities).reduce((sum, value) => sum + value, 0)
  const totalCents = tariffs.reduce(
    (sum, tariff) => sum + tariff.memberPriceCents * (quantities[tariff.id] ?? 0),
    0,
  )
  const overAllowance = remainingAllowance !== null && totalQuantity > remainingAllowance

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <FormMessage state={state} />

      <fieldset className="flex flex-col">
        <legend className="mb-3 label-caps text-ink-muted">Choisissez vos billets</legend>
        {tariffs.map((tariff) => {
          const soldOut = tariff.stock !== null && tariff.stock <= 0
          const max = Math.min(MAX_QUANTITY_PER_LINE, tariff.stock ?? MAX_QUANTITY_PER_LINE)
          const inputId = `qty_${tariff.id}`
          return (
            <div
              key={tariff.id}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-line py-4"
            >
              <div className="flex flex-col gap-0.5">
                <label htmlFor={inputId} className="font-semibold">
                  {tariff.label}
                </label>
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-display text-lead font-extrabold tabular">
                    {formatEuros(tariff.memberPriceCents)}
                  </span>
                  {tariff.publicPriceCents && tariff.publicPriceCents > tariff.memberPriceCents ? (
                    <span className="text-ink-muted">
                      au lieu de <s className="tabular">{formatEuros(tariff.publicPriceCents)}</s>
                    </span>
                  ) : null}
                </p>
                {soldOut ? (
                  <p className="text-sm font-semibold text-danger-700">Épuisé</p>
                ) : tariff.stock !== null && tariff.stock <= 10 ? (
                  <p className="text-sm font-semibold text-warning-800">
                    Plus que {tariff.stock} place{tariff.stock > 1 ? 's' : ''}
                  </p>
                ) : null}
              </div>
              <input
                id={inputId}
                name={inputId}
                type="number"
                inputMode="numeric"
                min={0}
                max={max}
                step={1}
                disabled={soldOut}
                value={quantities[tariff.id] ?? 0}
                onChange={(event) => {
                  const value = Math.max(0, Math.min(max, Math.floor(Number(event.target.value) || 0)))
                  setQuantities((current) => ({ ...current, [tariff.id]: value }))
                }}
                className="h-12 w-20 rounded-sm border border-line-strong bg-surface px-3 text-center text-lead font-semibold tabular hover:border-ink focus-visible:border-blue-500 disabled:bg-sunken"
              />
            </div>
          )
        })}
      </fieldset>

      <div className="flex flex-col gap-4 border-t-2 border-ink pt-5">
        <div className="flex items-baseline justify-between" aria-live="polite">
          <span className="font-semibold">
            Total{totalQuantity > 0 ? ` · ${totalQuantity} billet${totalQuantity > 1 ? 's' : ''}` : ''}
          </span>
          <span className="font-display text-h2 font-black tabular">{formatEuros(totalCents)}</span>
        </div>
        {overAllowance ? (
          <p className="text-sm font-semibold text-danger-700">
            Vous pouvez encore commander {remainingAllowance} billet{remainingAllowance === 1 ? '' : 's'} pour
            cette offre.
          </p>
        ) : null}
        <SubmitButton pendingLabel="Enregistrement de la commande…" className="w-full">
          Commander
        </SubmitButton>
        <p className="text-caption text-ink-muted">
          Votre commande est réservée immédiatement ; elle est confirmée à réception de votre règlement.
        </p>
      </div>
    </form>
  )
}
