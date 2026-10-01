'use client'

import { Plus, X } from 'lucide-react'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckboxField, SelectField, TextareaField, TextField } from '@/components/ui/fields'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/ui/submit-button'
import { ImageDropzone } from '@/features/media/components/image-dropzone'
import { idleState } from '@/lib/form-state'
import { saveOfferAction } from '../actions'
import { OFFER_CATEGORIES, OFFER_CATEGORY_LABELS, OFFER_KIND_LABELS } from '../labels'

export type OfferFormValues = {
  id?: string
  title: string
  slug: string
  kind: 'TICKET' | 'EVENT'
  category: string
  summary: string
  description: string
  pickupInfo: string
  location: string
  eventStartsAt: string
  validUntil: string
  orderDeadline: string
  maxPerMember: string
  imageId: string | null
  featured: boolean
  pricesPublic: boolean
  tariffs: TariffRow[]
}

type TariffRow = {
  key: string
  id: string
  label: string
  memberPrice: string
  publicPrice: string
  stock: string
  active: boolean
  /** Un tarif déjà commandé ne peut pas être supprimé, seulement désactivé. */
  locked: boolean
}

type FormDataValues = Record<string, string> | undefined

const CATEGORY_OPTIONS = OFFER_CATEGORIES.map((value) => ({ value, label: OFFER_CATEGORY_LABELS[value] }))
const KIND_OPTIONS = (['TICKET', 'EVENT'] as const).map((value) => ({
  value,
  label: OFFER_KIND_LABELS[value],
}))

let keySequence = 0
const newRow = (): TariffRow => ({
  key: `new-${++keySequence}`,
  id: '',
  label: '',
  memberPrice: '',
  publicPrice: '',
  stock: '',
  active: true,
  locked: false,
})

/** Restaure les lignes de tarifs saisies après une erreur de validation. */
function rowsFromValues(values: Record<string, string>, fallback: TariffRow[]): TariffRow[] {
  const indexes = [...new Set(Object.keys(values).flatMap((key) => /^tariffs\.(\d+)\./.exec(key)?.[1] ?? []))]
  if (indexes.length === 0) return fallback
  return indexes
    .map(Number)
    .sort((a, b) => a - b)
    .map((index) => {
      const get = (field: string) => values[`tariffs.${index}.${field}`] ?? ''
      const id = get('id')
      return {
        key: id || `restored-${index}`,
        id,
        label: get('label'),
        memberPrice: get('memberPrice'),
        publicPrice: get('publicPrice'),
        stock: get('stock'),
        active: get('active') === 'on',
        locked: fallback.find((row) => row.id === id)?.locked ?? false,
      }
    })
}

export function OfferForm({ initial }: { initial: OfferFormValues }) {
  const [state, formAction] = useActionState(saveOfferAction, idleState)
  const v = state.values
  const e = state.fieldErrors
  const [kind, setKind] = useState(v?.kind ?? initial.kind)
  const [rows, setRows] = useState<TariffRow[]>(() =>
    initial.tariffs.length > 0 ? initial.tariffs : [newRow()],
  )
  const [restoredFrom, setRestoredFrom] = useState<FormDataValues>(undefined)

  // Après une erreur, React réinitialise le formulaire : on repart de la saisie renvoyée par le serveur.
  if (v && v !== restoredFrom) {
    setRestoredFrom(v)
    setRows(rowsFromValues(v, rows))
  }

  const value = (name: Exclude<keyof OfferFormValues, 'tariffs' | 'featured' | 'pricesPublic'>) =>
    v?.[name] ?? initial[name] ?? ''

  return (
    <form action={formAction} className="flex flex-col gap-10" noValidate>
      {initial.id ? <input type="hidden" name="offerId" value={initial.id} /> : null}
      <FormMessage state={state} />

      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="mb-6 font-display text-h3 font-extrabold">Présentation</legend>
        <TextField
          name="title"
          label="Titre"
          required
          defaultValue={value('title')}
          error={e?.title}
          className="md:col-span-2"
        />
        <SelectField
          name="kind"
          label="Type"
          required
          options={KIND_OPTIONS}
          value={kind}
          onChange={(event) => setKind(event.target.value as 'TICKET' | 'EVENT')}
          error={e?.kind}
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
          name="summary"
          label="Résumé"
          hint="Une ou deux phrases, affichées dans le catalogue (220 caractères max.)."
          required
          maxLength={220}
          defaultValue={value('summary')}
          error={e?.summary}
          className="md:col-span-2"
        />
        <TextareaField
          name="description"
          label="Description"
          hint="Texte brut ; laissez une ligne vide entre deux paragraphes."
          required
          rows={8}
          defaultValue={value('description')}
          error={e?.description}
          className="md:col-span-2"
        />
        <div className="md:col-span-2">
          <ImageDropzone
            name="imageId"
            label="Visuel de l’offre"
            hint="Sans image, un visuel de la catégorie est affiché."
            defaultMediaId={v ? v.imageId || null : initial.imageId}
            error={e?.imageId}
          />
        </div>
        <CheckboxField
          name="featured"
          label="Mettre à la une (en tête du catalogue et sur la page d’accueil)"
          defaultChecked={v ? v.featured === 'on' : initial.featured}
          className="md:col-span-2"
        />
        <CheckboxField
          name="pricesPublic"
          label={
            <>
              Afficher les tarifs aux visiteurs non connectés
              <span className="block text-sm text-ink-muted">
                Décoché : les visiteurs voient l’offre, mais ses tarifs ne s’affichent qu’aux adhérents
                connectés.
              </span>
            </>
          }
          defaultChecked={v ? v.pricesPublic === 'on' : initial.pricesPublic}
          className="md:col-span-2"
        />
        <TextField
          name="slug"
          label="Adresse de la page"
          hint="Générée depuis le titre si laissée vide. Ex. : parc-asterix-2026"
          defaultValue={value('slug')}
          error={e?.slug}
          className="md:col-span-2"
        />
      </fieldset>

      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="mb-6 font-display text-h3 font-extrabold">Informations pratiques</legend>
        {kind === 'EVENT' ? (
          <>
            <TextField
              name="eventStartsAt"
              type="datetime-local"
              label="Date et heure de la sortie"
              required
              defaultValue={value('eventStartsAt')}
              error={e?.eventStartsAt}
            />
            <TextField name="location" label="Lieu" defaultValue={value('location')} error={e?.location} />
          </>
        ) : (
          <TextField
            name="validUntil"
            type="date"
            label="Billets valables jusqu’au"
            defaultValue={value('validUntil')}
            error={e?.validUntil}
          />
        )}
        <TextField
          name="orderDeadline"
          type="datetime-local"
          label="Clôture des commandes"
          defaultValue={value('orderDeadline')}
          error={e?.orderDeadline}
        />
        <TextField
          name="maxPerMember"
          type="number"
          inputMode="numeric"
          min={1}
          label="Limite de billets par adhérent"
          hint="Tous tarifs confondus. Vide = sans limite."
          defaultValue={value('maxPerMember')}
          error={e?.maxPerMember}
        />
        <TextareaField
          name="pickupInfo"
          label="Remise des billets"
          hint="Ex. : e-billets envoyés par email, retrait lors de la permanence…"
          rows={3}
          defaultValue={value('pickupInfo')}
          error={e?.pickupInfo}
          className="md:col-span-2"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-display text-h3 font-extrabold">Tarifs</legend>
        <p className="text-sm text-ink-muted">
          Les montants sont en euros (ex. 12,50). Stock vide = sans limite. Le stock diminue à chaque commande
          et est restitué en cas d’annulation.
        </p>
        {e?.tariffs ? <p className="text-sm font-semibold text-danger-700">{e.tariffs}</p> : null}
        <ol className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <li
              key={row.key}
              className="grid gap-4 rounded-md border border-line bg-paper p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-start"
            >
              <input type="hidden" name={`tariffs.${index}.id`} value={row.id} />
              <TextField
                id={`tariff-${row.key}-label`}
                name={`tariffs.${index}.label`}
                label="Libellé"
                required
                placeholder="Adulte"
                defaultValue={row.label}
                error={e?.[`tariffs.${index}.label`]}
              />
              <TextField
                id={`tariff-${row.key}-member`}
                name={`tariffs.${index}.memberPrice`}
                label="Prix adhérent"
                inputMode="decimal"
                required
                defaultValue={row.memberPrice}
                error={e?.[`tariffs.${index}.memberPrice`]}
              />
              <TextField
                id={`tariff-${row.key}-public`}
                name={`tariffs.${index}.publicPrice`}
                label="Prix public"
                inputMode="decimal"
                defaultValue={row.publicPrice}
                error={e?.[`tariffs.${index}.publicPrice`]}
              />
              <TextField
                id={`tariff-${row.key}-stock`}
                name={`tariffs.${index}.stock`}
                label="Stock"
                inputMode="numeric"
                defaultValue={row.stock}
                error={e?.[`tariffs.${index}.stock`]}
              />
              <div className="flex flex-col gap-3 md:pt-8">
                <CheckboxField
                  id={`tariff-${row.key}-active`}
                  name={`tariffs.${index}.active`}
                  label="Actif"
                  defaultChecked={row.active}
                />
                {!row.locked ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRows((current) => current.filter((candidate) => candidate.key !== row.key))
                    }
                    disabled={rows.length === 1}
                  >
                    <X aria-hidden className="size-4" /> Retirer
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => setRows((current) => [...current, newRow()])}
        >
          <Plus aria-hidden className="size-4" /> Ajouter un tarif
        </Button>
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-line pt-8">
        <SubmitButton pendingLabel="Enregistrement…">
          {initial.id ? 'Enregistrer les modifications' : 'Créer l’offre'}
        </SubmitButton>
      </div>
    </form>
  )
}
