'use client'

import { useActionState } from 'react'
import { TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { saveSettingsAction } from '../actions'

export function SettingsForm({ membershipUrl }: { membershipUrl: string | null }) {
  const [state, formAction] = useActionState(saveSettingsAction, idleState)
  const v = state.values
  const e = state.fieldErrors
  return (
    <form action={formAction} className="flex max-w-prose flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <TextField
        name="membershipUrl"
        type="url"
        inputMode="url"
        label="Lien HelloAsso d’adhésion"
        hint="Page HelloAsso où l’on adhère à l’Amicale. Utilisé par tous les boutons « Adhérer » du site. Vide : les boutons mènent à la page « Adhérer » du site."
        placeholder="https://www.helloasso.com/associations/…"
        defaultValue={v?.membershipUrl ?? membershipUrl ?? ''}
        error={e?.membershipUrl}
      />
      <SubmitButton pendingLabel="Enregistrement…" className="self-start">
        Enregistrer
      </SubmitButton>
    </form>
  )
}
