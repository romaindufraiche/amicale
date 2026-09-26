'use client'

import { useActionState } from 'react'
import { TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { changePasswordAction, forgotPasswordAction, resetPasswordAction } from '../actions'
import { PASSWORD_MIN } from '../schemas'

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, idleState)
  if (state.status === 'success') return <FormMessage state={state} />
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <TextField
        name="email"
        type="email"
        label="Adresse email du compte"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <SubmitButton pendingLabel="Envoi…" className="w-full">
        Recevoir un lien de réinitialisation
      </SubmitButton>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, idleState)
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <TextField
        name="password"
        type="password"
        label="Nouveau mot de passe"
        hint={`Au moins ${PASSWORD_MIN} caractères.`}
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        required
        error={state.fieldErrors?.password}
      />
      <TextField
        name="passwordConfirm"
        type="password"
        label="Confirmation"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.passwordConfirm}
      />
      <SubmitButton pendingLabel="Enregistrement…" className="w-full">
        Enregistrer le mot de passe
      </SubmitButton>
    </form>
  )
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, idleState)
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <TextField
        name="currentPassword"
        type="password"
        label="Mot de passe actuel"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.currentPassword}
      />
      <TextField
        name="password"
        type="password"
        label="Nouveau mot de passe"
        hint={`Au moins ${PASSWORD_MIN} caractères.`}
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        required
        error={state.fieldErrors?.password}
      />
      <TextField
        name="passwordConfirm"
        type="password"
        label="Confirmation"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.passwordConfirm}
      />
      <SubmitButton variant="secondary" pendingLabel="Enregistrement…" className="self-start">
        Modifier mon mot de passe
      </SubmitButton>
    </form>
  )
}
