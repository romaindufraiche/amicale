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
 * Commande en deux temps : la personne laisse ses coordonnées (enregistrées pour le bureau),
 * puis rejoint la page HelloAsso de l'offre pour payer.
 */
export function OfferRequestForm({ offerId }: { offerId: string }) {
  const [state, formAction] = useActionState<OfferRequestState, FormData>(submitOfferRequestAction, idleState)

  if (state.status === 'success') {
    return state.paymentUrl ? (
      <div className="flex flex-col gap-4">
        <Alert tone="success" title="Vos coordonnées sont enregistrées.">
          Dernière étape : réglez votre commande sur HelloAsso, la plateforme de paiement de l’Amicale.
        </Alert>
        <a href={state.paymentUrl} rel="noopener noreferrer" className={buttonClasses('primary', 'md')}>
          Continuer vers le paiement <ExternalLink aria-hidden className="size-4" />
        </a>
        <p className="text-sm text-ink-muted">Paiement sécurisé sur le site helloasso.com.</p>
      </div>
    ) : (
      <Alert tone="success" title="Demande enregistrée.">
        Le bureau vous recontactera par email pour le règlement.
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
      <TextField
        name="phone"
        type="tel"
        label="Téléphone"
        autoComplete="tel"
        defaultValue={v?.phone}
        error={e?.phone}
      />
      {/* Champ piège pour les robots : masqué visuellement et ignoré au clavier. */}
      <div aria-hidden className="sr-only">
        <label htmlFor="request-website">Ne pas remplir</label>
        <input id="request-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton pendingLabel="Envoi…">Commander</SubmitButton>
      <p className="text-caption text-ink-muted">
        Vos coordonnées sont transmises au bureau de l’Amicale pour le suivi de votre commande.{' '}
        <Link href="/confidentialite" className="link">
          En savoir plus
        </Link>
      </p>
    </form>
  )
}
