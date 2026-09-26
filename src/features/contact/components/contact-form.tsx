'use client'

import { useActionState } from 'react'
import { SelectField, TextareaField, TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { contactAction } from '../actions'
import { CONTACT_SUBJECTS } from '../schemas'

const SUBJECT_OPTIONS = CONTACT_SUBJECTS.map((subject) => ({ value: subject, label: subject }))

export function ContactForm({ defaultName, defaultEmail }: { defaultName?: string; defaultEmail?: string }) {
  const [state, formAction] = useActionState(contactAction, idleState)
  if (state.status === 'success') return <FormMessage state={state} />

  const v = state.values
  const e = state.fieldErrors
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="name"
          label="Nom et prénom"
          autoComplete="name"
          required
          defaultValue={v?.name ?? defaultName}
          error={e?.name}
        />
        <TextField
          name="email"
          type="email"
          label="Adresse email"
          autoComplete="email"
          required
          defaultValue={v?.email ?? defaultEmail}
          error={e?.email}
        />
      </div>
      <SelectField
        name="subject"
        label="Objet"
        required
        placeholder="Sélectionnez…"
        options={SUBJECT_OPTIONS}
        defaultValue={v?.subject ?? ''}
        error={e?.subject}
      />
      <TextareaField
        name="message"
        label="Votre message"
        rows={7}
        required
        defaultValue={v?.message}
        error={e?.message}
      />
      {/* Champ piège pour les robots : masqué visuellement et ignoré au clavier. */}
      <div aria-hidden className="sr-only">
        <label htmlFor="website">Ne pas remplir</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton pendingLabel="Envoi…" className="self-start">
        Envoyer le message
      </SubmitButton>
    </form>
  )
}
