'use client'

import { useActionState } from 'react'
import { CheckboxField, TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { saveSettingsAction } from '../actions'

export function SettingsForm({
  membershipUrl,
  membershipOpen,
  ordersEmail,
  defaultOrdersEmail,
}: {
  membershipUrl: string | null
  membershipOpen: boolean
  ordersEmail: string | null
  /** Adresse utilisée tant que le champ est vide (variable `BUREAU_EMAIL`). */
  defaultOrdersEmail: string
}) {
  const [state, formAction] = useActionState(saveSettingsAction, idleState)
  const v = state.values
  const e = state.fieldErrors
  return (
    <form action={formAction} className="flex max-w-prose flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <div className="flex flex-col gap-1.5">
        <CheckboxField
          name="membershipOpen"
          label={<span className="font-semibold">Afficher les boutons « Adhérer en ligne »</span>}
          defaultChecked={v ? v.membershipOpen === 'on' : membershipOpen}
          aria-describedby="membershipOpen-hint"
        />
        <p id="membershipOpen-hint" className="pl-8 text-sm text-ink-muted">
          Décochez pour fermer temporairement les adhésions : les boutons « Adhérer » du site et le lien
          HelloAsso sont masqués, et la page « Adhérer » indique que les adhésions sont fermées.
        </p>
      </div>
      <TextField
        name="membershipUrl"
        type="url"
        inputMode="url"
        label="Lien HelloAsso d’adhésion"
        hint="Page HelloAsso où l’on adhère à l’Amicale, utilisée par tous les boutons « Adhérer » du site. À mettre à jour à chaque nouvelle campagne d’adhésion (ex. adhesion-2027). Vide : les boutons mènent à la page « Adhérer » du site."
        placeholder="https://www.helloasso.com/associations/…"
        defaultValue={v?.membershipUrl ?? membershipUrl ?? ''}
        error={e?.membershipUrl}
      />
      <TextField
        name="ordersEmail"
        type="email"
        label="Adresse qui reçoit les commandes"
        hint={`Un email y est envoyé à chaque commande passée sur le site. Vide : ${defaultOrdersEmail}.`}
        autoComplete="email"
        defaultValue={v?.ordersEmail ?? ordersEmail ?? ''}
        error={e?.ordersEmail}
      />
      <SubmitButton pendingLabel="Enregistrement…" className="self-start">
        Enregistrer
      </SubmitButton>
    </form>
  )
}
