'use client'

import { useActionState } from 'react'
import { SelectField, TextareaField, TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { saveNewsAction } from '../actions'

export type NewsFormValues = {
  id?: string
  title: string
  slug: string
  excerpt: string
  body: string
  visibility: string
}

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public — visible par tous' },
  { value: 'MEMBERS', label: 'Adhérents — lecture réservée aux adhérents connectés' },
]

export function NewsForm({ initial }: { initial: NewsFormValues }) {
  const [state, formAction] = useActionState(saveNewsAction, idleState)
  const value = (name: keyof NewsFormValues) => state.values?.[name] ?? initial[name] ?? ''
  const e = state.fieldErrors
  return (
    <form action={formAction} className="flex max-w-prose flex-col gap-6" noValidate>
      {initial.id ? <input type="hidden" name="newsId" value={initial.id} /> : null}
      <FormMessage state={state} />
      <TextField name="title" label="Titre" required defaultValue={value('title')} error={e?.title} />
      <TextareaField
        name="excerpt"
        label="Chapô"
        hint="Résumé affiché dans les listes et les moteurs de recherche (280 caractères max.)."
        required
        rows={3}
        maxLength={280}
        defaultValue={value('excerpt')}
        error={e?.excerpt}
      />
      <TextareaField
        name="body"
        label="Texte"
        hint="Texte brut ; laissez une ligne vide entre deux paragraphes."
        required
        rows={14}
        defaultValue={value('body')}
        error={e?.body}
      />
      <SelectField
        name="visibility"
        label="Visibilité"
        required
        options={VISIBILITY_OPTIONS}
        defaultValue={value('visibility')}
        error={e?.visibility}
      />
      <TextField
        name="slug"
        label="Adresse de la page"
        hint="Générée depuis le titre si laissée vide."
        defaultValue={value('slug')}
        error={e?.slug}
      />
      <SubmitButton pendingLabel="Enregistrement…" className="self-start">
        {initial.id ? 'Enregistrer les modifications' : 'Créer le brouillon'}
      </SubmitButton>
    </form>
  )
}
