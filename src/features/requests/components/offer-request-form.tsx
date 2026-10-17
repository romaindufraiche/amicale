'use client'

import { Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useId, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { type FormState, idleState } from '@/lib/form-state'
import { submitOfferRequestAction } from '../actions'
import { MAX_TICKETS_PER_TARIFF } from '../schemas'

export type OrderableTariff = {
  id: string
  label: string
  /** Places restantes ; `null` = sans limite. */
  stock: number | null
}

/** Sélecteur de quantité : boutons − et +, et saisie directe au clavier. */
function QuantityStepper({
  tariff,
  label,
  defaultValue,
}: {
  tariff: OrderableTariff
  label: string
  defaultValue: number
}) {
  const id = useId()
  const max = Math.min(MAX_TICKETS_PER_TARIFF, tariff.stock ?? MAX_TICKETS_PER_TARIFF)
  const [quantity, setQuantity] = useState(Math.min(defaultValue, max))
  const set = (value: number) => setQuantity(Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0)))
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => set(quantity - 1)}
          disabled={quantity <= 0}
          aria-label={`Retirer un billet (${tariff.label})`}
          className="grid size-10 place-items-center rounded-sm border border-line-strong bg-surface hover:border-ink disabled:opacity-40"
        >
          <Minus aria-hidden className="size-4" />
        </button>
        {/* Flèches natives masquées (boutons − / + dédiés) : le chiffre reste centré. */}
        <input
          id={id}
          name={`qty.${tariff.id}`}
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={quantity}
          onChange={(event) => set(Number.parseInt(event.target.value, 10))}
          className="h-10 w-14 [appearance:textfield] rounded-sm border border-line-strong bg-surface p-0 text-center font-semibold tabular focus-visible:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => set(quantity + 1)}
          disabled={quantity >= max}
          aria-label={`Ajouter un billet (${tariff.label})`}
          className="grid size-10 place-items-center rounded-sm border border-line-strong bg-surface hover:border-ink disabled:opacity-40"
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  )
}

/** Commande d'une offre : nombre de billets, nom, prénom et email ; le bureau est prévenu par email. */
/** Prénom, nom et email remplis, et au moins un billet : la commande peut partir. */
function isComplete(form: HTMLFormElement): boolean {
  const data = new FormData(form)
  const filled = (name: string) => String(data.get(name) ?? '').trim() !== ''
  const tickets = [...data.entries()]
    .filter(([key]) => key.startsWith('qty.'))
    .reduce((total, [, value]) => total + (Number(value) || 0), 0)
  return filled('firstName') && filled('lastName') && filled('email') && tickets > 0
}

export function OfferRequestForm({ offerId, tariffs }: { offerId: string; tariffs: OrderableTariff[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(submitOfferRequestAction, idleState)
  // Bouton « Envoyer » actif seulement quand le formulaire est complet (contrôle refait côté serveur).
  const [complete, setComplete] = useState(false)
  const hintId = useId()

  if (state.status === 'success') {
    return (
      <Alert tone="success" title="Commande envoyée.">
        Merci ! Le bureau de l’Amicale a bien reçu votre commande et vous recontactera par email.
      </Alert>
    )
  }

  const v = state.values
  const e = state.fieldErrors
  return (
    <form
      action={formAction}
      className="flex flex-col gap-5"
      noValidate
      onInput={(event) => setComplete(isComplete(event.currentTarget))}
      onClick={(event) => {
        // Boutons − / + : la quantité change au rendu suivant, on relit le formulaire ensuite.
        const form = event.currentTarget
        requestAnimationFrame(() => setComplete(isComplete(form)))
      }}
    >
      <FormMessage state={state} />
      <input type="hidden" name="offerId" value={offerId} />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">Nombre de billets</legend>
        {tariffs.map((tariff, index) => (
          <QuantityStepper
            key={tariff.id}
            tariff={tariff}
            label={tariffs.length === 1 ? 'Billets' : tariff.label}
            defaultValue={Number(v?.[`qty.${tariff.id}`] ?? (index === 0 ? 1 : 0))}
          />
        ))}
        {e?.quantities ? <p className="text-sm font-semibold text-danger-700">{e.quantities}</p> : null}
      </fieldset>
      <TextField
        name="firstName"
        label="Prénom"
        autoComplete="given-name"
        required
        defaultValue={v?.firstName}
        error={e?.firstName}
      />
      <TextField
        name="lastName"
        label="Nom"
        autoComplete="family-name"
        required
        defaultValue={v?.lastName}
        error={e?.lastName}
      />
      <TextField
        name="email"
        type="email"
        label="Adresse email"
        autoComplete="email"
        required
        defaultValue={v?.email}
        error={e?.email}
      />
      {/* Champ piège pour les robots : masqué visuellement et ignoré au clavier. */}
      <div aria-hidden className="sr-only">
        <label htmlFor="request-website">Ne pas remplir</label>
        <input id="request-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton
        pendingLabel="Envoi…"
        disabled={!complete}
        aria-describedby={complete ? undefined : hintId}
      >
        Envoyer ma commande
      </SubmitButton>
      {!complete ? (
        <p id={hintId} className="-mt-3 text-sm text-ink-muted">
          Renseignez votre prénom, votre nom et votre email pour envoyer la commande.
        </p>
      ) : null}
      <p className="text-caption text-ink-muted">
        Vos coordonnées sont transmises au bureau de l’Amicale pour le suivi de votre commande.{' '}
        <Link href="/confidentialite" className="link">
          En savoir plus
        </Link>
      </p>
    </form>
  )
}
