'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { CheckboxField, SelectField, TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { MEMBER_CATEGORIES, MEMBER_CATEGORY_LABELS } from '@/features/members/categories'
import { idleState } from '@/lib/form-state'
import { registerAction } from '../actions'
import { PASSWORD_MIN } from '../schemas'

const CATEGORY_OPTIONS = MEMBER_CATEGORIES.map((value) => ({ value, label: MEMBER_CATEGORY_LABELS[value] }))

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, idleState)
  const v = state.values
  const e = state.fieldErrors

  return (
    <form action={formAction} className="flex flex-col gap-10" noValidate>
      <FormMessage state={state} />

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 font-display text-h3 font-extrabold">Votre identité</legend>
        <div className="grid gap-6 sm:grid-cols-2">
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
        </div>
        <TextField
          name="email"
          type="email"
          label="Adresse email"
          hint="Personnelle ou professionnelle : elle servira à vous connecter et à recevoir vos confirmations."
          autoComplete="email"
          required
          defaultValue={v?.email}
          error={e?.email}
        />
        <TextField
          name="phone"
          type="tel"
          label="Téléphone"
          autoComplete="tel"
          defaultValue={v?.phone}
          error={e?.phone}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 font-display text-h3 font-extrabold">Votre situation</legend>
        <SelectField
          name="category"
          label="Situation"
          required
          placeholder="Sélectionnez…"
          options={CATEGORY_OPTIONS}
          defaultValue={v?.category ?? ''}
          error={e?.category}
        />
        <TextField
          name="assignment"
          label="Service d’affectation"
          hint="Permet au bureau de vérifier votre demande. Ex. : commissariat, direction, service."
          autoComplete="organization"
          defaultValue={v?.assignment}
          error={e?.assignment}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 font-display text-h3 font-extrabold">Votre mot de passe</legend>
        <TextField
          name="password"
          type="password"
          label="Mot de passe"
          hint={`Au moins ${PASSWORD_MIN} caractères. Une phrase de passe est à la fois sûre et facile à retenir.`}
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          required
          error={e?.password}
        />
        <TextField
          name="passwordConfirm"
          type="password"
          label="Confirmation du mot de passe"
          autoComplete="new-password"
          required
          error={e?.passwordConfirm}
        />
      </fieldset>

      <div className="flex flex-col gap-6 border-t border-line pt-8">
        <CheckboxField
          name="certify"
          defaultChecked={v?.certify === 'on'}
          error={e?.certify}
          label={
            <>
              Je certifie l’exactitude de ces informations et j’ai pris connaissance de la{' '}
              <Link href="/confidentialite" className="link" target="_blank">
                politique de protection des données
              </Link>
              .
            </>
          }
        />
        <SubmitButton pendingLabel="Envoi de la demande…" className="self-start">
          Envoyer ma demande d’adhésion
        </SubmitButton>
      </div>
    </form>
  )
}
