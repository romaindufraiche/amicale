'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import { Alert } from '@/components/ui/alert'
import { buttonClasses } from '@/components/ui/button'
import { TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { idleState } from '@/lib/form-state'
import { type OfferRequestState, submitOfferRequestAction } from '../actions'

/**
 * Commande d'une offre : nom, prénom et email, enregistrés pour le bureau (prévenu par email).
 * Si l'offre a une page HelloAsso, la personne y est ensuite dirigée pour payer.
 */
export function OfferRequestForm({ offerId }: { offerId: string }) {
  const [state, formAction] = useActionState<OfferRequestState, FormData>(submitOfferRequestAction, idleState)

  if (state.status === 'success') {
    return state.paymentUrl ? (
      <div className="flex flex-col gap-4">
        <Alert tone="success" title="Commande envoyée.">
          Dernière étape : réglez votre commande sur HelloAsso, la plateforme de paiement de l’Amicale.
        </Alert>
        <a href={state.paymentUrl} rel="noopener noreferrer" className={buttonClasses('primary', 'md')}>
          Continuer vers le paiement <ExternalLink aria-hidden className="size-4" />
        </a>
        <p className="text-sm text-ink-muted">Paiement sécurisé sur le site helloasso.com.</p>
      </div>
    ) : (
      <Alert tone="success" title="Commande envoyée.">
        Merci ! Le bureau de l’Amicale a bien reçu votre commande et vous recontactera par email.
      </Alert>
    )
  }

  const v = state.values
  const e = state.fieldErrors
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="offerId" value={offerId} />
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
      <TextField
        name="email"
        type="email"
        label="Adresse email"
        autoComplete="email"
        required
        defaultValue={v?.email}
        error={e?.email}
      />
      {/* Champ piège pour les robots : masqué visuellement et ignoré au clavier. */}
      <div aria-hidden className="sr-only">
        <label htmlFor="request-website">Ne pas remplir</label>
        <input id="request-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton pendingLabel="Envoi…">Envoyer ma commande</SubmitButton>
      <p className="text-caption text-ink-muted">
        Vos coordonnées sont transmises au bureau de l’Amicale pour le suivi de votre commande.{' '}
        <Link href="/confidentialite" className="link">
          En savoir plus
        </Link>
      </p>
    </form>
  )
}
