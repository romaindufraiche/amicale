'use client'

import { useActionState, useState } from 'react'
import { TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { issueCardAction } from '../actions'
import { CardPreview } from './card-preview'

/** Saisie du nom et du prénom, avec aperçu de la carte en direct. */
export function CardGenerator({ season }: { season: string }) {
  const [state, formAction] = useActionState(issueCardAction, idleState)
  const [lastName, setLastName] = useState(state.values?.lastName ?? '')
  const [firstName, setFirstName] = useState(state.values?.firstName ?? '')
  const e = state.fieldErrors

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start">
      <form action={formAction} className="flex max-w-prose flex-col gap-6" noValidate>
        <FormMessage state={state} />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            name="lastName"
            label="Nom"
            required
            maxLength={40}
            autoComplete="off"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={e?.lastName}
          />
          <TextField
            name="firstName"
            label="Prénom"
            required
            maxLength={40}
            autoComplete="off"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={e?.firstName}
          />
        </div>
        <p className="text-sm text-ink-muted">
          Saison imprimée : <strong className="text-ink">{season}</strong> (modifiable dans les Réglages). Un
          adhérent déjà dans le listing garde son numéro : sa carte passe simplement à la nouvelle saison.
        </p>
        <SubmitButton pendingLabel="Création…" className="self-start">
          Créer la carte
        </SubmitButton>
      </form>
      <div className="flex w-full flex-col gap-3 lg:sticky lg:top-6 lg:w-[428px]">
        <p className="label-caps text-ink-muted">Aperçu</p>
        <CardPreview lastName={lastName.trim()} firstName={firstName.trim()} season={season} number={null} />
      </div>
    </div>
  )
}
