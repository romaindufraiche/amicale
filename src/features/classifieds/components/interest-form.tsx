'use client'

import { HeartHandshake } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import { Alert } from '@/components/ui/alert'
import { TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { site } from '@/config/site'
import { type FormState, idleState } from '@/lib/form-state'
import { submitClassifiedInterestAction } from '../actions'

/** « Cette annonce m'intéresse » : nom, prénom, email et téléphone, transmis au bureau. */
export function InterestForm({ classifiedId }: { classifiedId: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(submitClassifiedInterestAction, idleState)

  if (state.status === 'success') {
    return (
      <Alert tone="success" title="Demande envoyée.">
        Merci ! {site.notices.classifiedContact}
      </Alert>
    )
  }

  const v = state.values
  const e = state.fieldErrors
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <h2 className="inline-flex items-center gap-2 text-h3">
        <HeartHandshake aria-hidden className="size-6 text-rose-600" /> Cette annonce m’intéresse
      </h2>
      <p className="text-sm text-ink-muted">{site.notices.classifiedContact}</p>
      <FormMessage state={state} />
      <input type="hidden" name="classifiedId" value={classifiedId} />
      <TextField
        name="lastName"
        label="Nom"
        autoComplete="family-name"
        required
        defaultValue={v?.lastName}
        error={e?.lastName}
      />
      <TextField
        name="firstName"
        label="Prénom"
        autoComplete="given-name"
        required
        defaultValue={v?.firstName}
        error={e?.firstName}
      />
      <TextField
        name="email"
        type="email"
        label="Adresse mail"
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
        inputMode="tel"
        required
        defaultValue={v?.phone}
        error={e?.phone}
      />
      {/* Champ piège pour les robots : masqué visuellement et ignoré au clavier. */}
      <div aria-hidden className="sr-only">
        <label htmlFor="interest-website">Ne pas remplir</label>
        <input id="interest-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton pendingLabel="Envoi…">Envoyer ma demande</SubmitButton>
      <p className="text-caption text-ink-muted">
        Vos coordonnées sont transmises au bureau de l’Amicale, qui les vérifie avant de vous mettre en
        relation avec le vendeur.{' '}
        <Link href="/confidentialite" className="link">
          En savoir plus
        </Link>
      </p>
    </form>
  )
}
