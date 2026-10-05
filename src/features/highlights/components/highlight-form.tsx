'use client'

import { useActionState } from 'react'
import { CheckboxField, SelectField, TextareaField, TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { ImageDropzone } from '@/features/media/components/image-dropzone'
import { idleState } from '@/lib/form-state'
import { saveHighlightAction } from '../actions'
import { HIGHLIGHT_TONES, HIGHLIGHT_TONE_VALUES } from '../labels'

export type HighlightFormValues = {
  id?: string
  title: string
  body: string
  linkUrl: string
  linkLabel: string
  tone: string
  imageId: string | null
  visibility: string
  startsAt: string
  endsAt: string
  position: string
  published: boolean
}

const TONE_OPTIONS = HIGHLIGHT_TONE_VALUES.map((value) => ({ value, label: HIGHLIGHT_TONES[value].label }))
const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Tout le monde (page d’accueil et espace adhérent)' },
  { value: 'MEMBERS', label: 'Adhérents connectés uniquement' },
]

export function HighlightForm({ initial }: { initial: HighlightFormValues }) {
  const [state, formAction] = useActionState(saveHighlightAction, idleState)
  const v = state.values
  const e = state.fieldErrors
  const value = (name: Exclude<keyof HighlightFormValues, 'published' | 'id' | 'imageId'>) =>
    v?.[name] ?? initial[name]

  return (
    <form action={formAction} className="flex max-w-prose flex-col gap-6" noValidate>
      {initial.id ? <input type="hidden" name="highlightId" value={initial.id} /> : null}
      <FormMessage state={state} />
      <TextField
        name="title"
        label="Titre"
        required
        maxLength={80}
        defaultValue={value('title')}
        error={e?.title}
      />
      <TextareaField
        name="body"
        label="Texte"
        hint="Court et direct : 220 caractères maximum."
        required
        rows={3}
        maxLength={220}
        defaultValue={value('body')}
        error={e?.body}
      />
      <ImageDropzone
        name="imageId"
        label="Image"
        hint="Affichée en haut du post. Sans image, le post garde sa couleur de fond."
        defaultMediaId={v ? v.imageId || null : initial.imageId}
        error={e?.imageId}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="linkUrl"
          label="Lien"
          hint="Page du site (/offres/…) ou adresse https://…"
          defaultValue={value('linkUrl')}
          error={e?.linkUrl}
        />
        <TextField
          name="linkLabel"
          label="Texte du lien"
          placeholder="En savoir plus"
          maxLength={40}
          defaultValue={value('linkLabel')}
          error={e?.linkLabel}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          name="tone"
          label="Couleur"
          required
          options={TONE_OPTIONS}
          defaultValue={value('tone')}
          error={e?.tone}
        />
        <TextField
          name="position"
          type="number"
          label="Ordre d’affichage"
          hint="Les plus petits nombres passent en premier."
          defaultValue={value('position')}
          error={e?.position}
        />
      </div>
      <SelectField
        name="visibility"
        label="Visible par"
        required
        options={VISIBILITY_OPTIONS}
        defaultValue={value('visibility')}
        error={e?.visibility}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="startsAt"
          type="datetime-local"
          label="Afficher à partir du"
          defaultValue={value('startsAt')}
          error={e?.startsAt}
        />
        <TextField
          name="endsAt"
          type="datetime-local"
          label="Retirer le"
          defaultValue={value('endsAt')}
          error={e?.endsAt}
        />
      </div>
      <CheckboxField
        name="published"
        label="Publier ce post"
        defaultChecked={v ? v.published === 'on' : initial.published}
      />
      <SubmitButton pendingLabel="Enregistrement…" className="self-start">
        {initial.id ? 'Enregistrer les modifications' : 'Créer le post'}
      </SubmitButton>
    </form>
  )
}
