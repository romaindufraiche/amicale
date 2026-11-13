'use client'

import { useActionState } from 'react'
import { CheckboxField, SelectField, TextareaField, TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { ImageDropzone } from '@/features/media/components/image-dropzone'
import { site } from '@/config/site'
import { idleState } from '@/lib/form-state'
import { saveClassifiedAction } from '../actions'
import { CLASSIFIED_KIND_VALUES, CLASSIFIED_KINDS } from '../labels'

export type ClassifiedFormValues = {
  id?: string
  kind: string
  title: string
  description: string
  imageId: string | null
  image2Id: string | null
  pinned: boolean
  published: boolean
}

const KIND_OPTIONS = CLASSIFIED_KIND_VALUES.map((value) => ({
  value,
  label: CLASSIFIED_KINDS[value].label.toUpperCase(),
}))

export function ClassifiedForm({ initial }: { initial: ClassifiedFormValues }) {
  const [state, formAction] = useActionState(saveClassifiedAction, idleState)
  const v = state.values
  const e = state.fieldErrors
  const value = (name: 'kind' | 'title' | 'description') => v?.[name] ?? initial[name]

  return (
    <form action={formAction} className="flex max-w-prose flex-col gap-6" noValidate>
      {initial.id ? <input type="hidden" name="classifiedId" value={initial.id} /> : null}
      <FormMessage state={state} />
      <SelectField
        name="kind"
        label="Type d’annonce"
        required
        placeholder="Choisir…"
        options={KIND_OPTIONS}
        defaultValue={value('kind')}
        error={e?.kind}
      />
      <TextField
        name="title"
        label="Titre"
        required
        maxLength={100}
        placeholder="Ex. : Maison 4 pièces à Cergy, Remorque à prêter…"
        defaultValue={value('title')}
        error={e?.title}
      />
      <TextareaField
        name="description"
        label="Description"
        hint="Détails, prix éventuel et moyen de contacter le collègue. Le site est public : n’indiquez un téléphone ou un email qu’avec son accord."
        required
        rows={8}
        maxLength={3000}
        defaultValue={value('description')}
        error={e?.description}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <ImageDropzone
          name="imageId"
          label="Photo 1"
          hint="Photo principale, affichée dans la liste des annonces."
          defaultMediaId={v ? v.imageId || null : initial.imageId}
          error={e?.imageId}
        />
        <ImageDropzone
          name="image2Id"
          label="Photo 2"
          hint="Seconde photo, visible sur la page de l’annonce."
          defaultMediaId={v ? v.image2Id || null : initial.image2Id}
          error={e?.image2Id}
        />
      </div>
      <CheckboxField
        name="pinned"
        label="Épingler en tête de la rubrique"
        defaultChecked={v ? v.pinned === 'on' : initial.pinned}
      />
      <CheckboxField
        name="published"
        label="Publier cette annonce"
        defaultChecked={v ? v.published === 'on' : initial.published}
      />
      <p className="text-sm text-ink-muted">{site.notices.classifiedLifetime}</p>
      <SubmitButton pendingLabel="Enregistrement…" className="self-start">
        {initial.id ? 'Enregistrer les modifications' : 'Publier l’annonce'}
      </SubmitButton>
    </form>
  )
}
