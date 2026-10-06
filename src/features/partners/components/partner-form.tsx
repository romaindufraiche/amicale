'use client'

import { useActionState } from 'react'
import { CheckboxField, SelectField, TextareaField, TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { OFFER_CATEGORIES, OFFER_CATEGORY_LABELS } from '@/features/offers/labels'
import { idleState } from '@/lib/form-state'
import { savePartnerAction } from '../actions'

export type PartnerFormValues = {
  id?: string
  name: string
  category: string
  advantage: string
  description: string
  howToBenefit: string
  websiteUrl: string
  published: boolean
}

const CATEGORY_OPTIONS = OFFER_CATEGORIES.map((value) => ({ value, label: OFFER_CATEGORY_LABELS[value] }))

export function PartnerForm({ initial }: { initial: PartnerFormValues }) {
  const [state, formAction] = useActionState(savePartnerAction, idleState)
  const v = state.values
  const e = state.fieldErrors
  const value = (name: Exclude<keyof PartnerFormValues, 'published'>) => v?.[name] ?? initial[name] ?? ''
  return (
    <form action={formAction} className="flex max-w-prose flex-col gap-6" noValidate>
      {initial.id ? <input type="hidden" name="partnerId" value={initial.id} /> : null}
      <FormMessage state={state} />
      <TextField
        name="name"
        label="Nom du partenaire"
        required
        defaultValue={value('name')}
        error={e?.name}
      />
      <SelectField
        name="category"
        label="Catégorie"
        required
        options={CATEGORY_OPTIONS}
        defaultValue={value('category')}
        error={e?.category}
      />
      <TextField
        name="advantage"
        label="Avantage"
        hint="Une phrase courte, ex. « Tarif préférentiel sur l’abonnement annuel »."
        required
        maxLength={160}
        defaultValue={value('advantage')}
        error={e?.advantage}
      />
      <TextareaField
        name="description"
        label="Présentation"
        rows={4}
        defaultValue={value('description')}
        error={e?.description}
      />
      <TextareaField
        name="howToBenefit"
        label="Comment en bénéficier"
        hint="Démarche, justificatif à présenter… Attention : visible de tous sur la page publique « Partenaires », n’y mettez pas de code confidentiel."
        required
        rows={4}
        defaultValue={value('howToBenefit')}
        error={e?.howToBenefit}
      />
      <TextField
        name="websiteUrl"
        type="url"
        label="Site web"
        placeholder="https://"
        defaultValue={value('websiteUrl')}
        error={e?.websiteUrl}
      />
      <CheckboxField
        name="published"
        label="Visible sur la page « Partenaires » du site"
        defaultChecked={v ? v.published === 'on' : initial.published}
      />
      <SubmitButton pendingLabel="Enregistrement…" className="self-start">
        {initial.id ? 'Enregistrer les modifications' : 'Ajouter le partenaire'}
      </SubmitButton>
    </form>
  )
}
