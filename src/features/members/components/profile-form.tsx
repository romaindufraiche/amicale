'use client'

import { useActionState } from 'react'
import { TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { updateProfileAction } from '@/features/auth/actions'
import { idleState } from '@/lib/form-state'

export function ProfileForm({ phone, assignment }: { phone: string | null; assignment: string | null }) {
  const [state, formAction] = useActionState(updateProfileAction, idleState)
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <TextField
        name="phone"
        type="tel"
        label="Téléphone"
        autoComplete="tel"
        defaultValue={state.values?.phone ?? phone ?? ''}
        error={state.fieldErrors?.phone}
      />
      <TextField
        name="assignment"
        label="Service d’affectation"
        autoComplete="organization"
        defaultValue={state.values?.assignment ?? assignment ?? ''}
        error={state.fieldErrors?.assignment}
      />
      <SubmitButton variant="secondary" pendingLabel="Enregistrement…" className="self-start">
        Enregistrer
      </SubmitButton>
    </form>
  )
}
