'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { loginAction } from '../actions'

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, idleState)
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <TextField
        name="email"
        type="email"
        label="Adresse email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <div className="flex flex-col gap-2">
        <TextField
          name="password"
          type="password"
          label="Mot de passe"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
        <Link href="/mot-de-passe-oublie" className="self-start text-sm link">
          Mot de passe oublié ?
        </Link>
      </div>
      <SubmitButton pendingLabel="Connexion…" className="w-full">
        Se connecter
      </SubmitButton>
    </form>
  )
}
