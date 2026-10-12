import { describe, expect, it } from 'vitest'
import { offerFormToObject, offerSchema } from '@/features/offers/schemas'
import {
  offerRequestFormToObject,
  offerRequestSchema,
  parseRequestFilters,
  requestFiltersQuery,
} from '@/features/requests/schemas'
import { isHttpsUrl } from '@/lib/https-url'
import { can } from '@/server/auth/permissions'

function form(entries: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

describe('offerSchema', () => {
  const base = {
    title: 'Parc de loisirs',
    slug: '',
    kind: 'EVENT',
    category: 'PARCS',
    summary: 'Une journée au parc.',
    description: 'Description suffisamment longue pour passer.',
    pickupInfo: '',
    location: '',
    eventStartsAt: '2026-07-01T09:00',
    validUntil: '',
    orderDeadline: '',
    'tariffs.0.id': '',
    'tariffs.0.label': 'Adulte',
    'tariffs.0.memberPrice': '25,50',
    'tariffs.0.publicPrice': '40',
    'tariffs.0.stock': '',
    'tariffs.0.active': 'on',
  }

  it('reconstruit et valide une offre depuis le formulaire', () => {
    const parsed = offerSchema.parse(offerFormToObject(form(base)))
    expect(parsed.slug).toBe('parc-de-loisirs')
    expect(parsed.eventStartsAt?.toISOString()).toBe('2026-07-01T07:00:00.000Z')
    expect(parsed.tariffs).toEqual([
      { id: null, label: 'Adulte', memberPrice: 2550, publicPrice: 4000, stock: null, active: true },
    ])
  })

  it('affiche les tarifs aux visiteurs seulement si la case est cochée', () => {
    expect(offerSchema.parse(offerFormToObject(form(base))).pricesPublic).toBe(false)
    expect(offerSchema.parse(offerFormToObject(form({ ...base, pricesPublic: 'on' }))).pricesPublic).toBe(
      true,
    )
  })

  it('valide le lien du prestataire et rend le résumé facultatif', () => {
    const parse = (extra: Record<string, string>) =>
      offerSchema.safeParse(offerFormToObject(form({ ...base, ...extra })))
    expect(parse({ providerUrl: '' }).data?.providerUrl).toBeNull()
    expect(parse({ providerUrl: ' https://www.campings.com ' }).data?.providerUrl).toBe(
      'https://www.campings.com',
    )
    expect(parse({ providerUrl: 'javascript:alert(1)' }).error?.issues[0]?.path).toEqual(['providerUrl'])
    expect(parse({ summary: '' }).data?.summary).toBeNull()
  })

  it('n’exige des tarifs que si le bouton « Commander » est affiché', () => {
    const withoutTariffs = Object.fromEntries(
      Object.entries(base).filter(([key]) => !key.startsWith('tariffs.')),
    )
    const parse = (extra: Record<string, string>) =>
      offerSchema.safeParse(offerFormToObject(form({ ...withoutTariffs, ...extra })))
    expect(parse({ orderable: 'on' }).error?.issues[0]?.path).toEqual(['tariffs'])
    expect(parse({}).success).toBe(true)
  })

  it('exige une date pour une sortie et refuse un prix public inférieur', () => {
    const result = offerSchema.safeParse(
      offerFormToObject(form({ ...base, eventStartsAt: '', 'tariffs.0.publicPrice': '10' })),
    )
    const paths = result.error?.issues.map((issue) => issue.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['eventStartsAt', 'tariffs.0.publicPrice']))
  })
})

describe('liens HelloAsso', () => {
  it('n’accepte que des adresses https complètes', () => {
    expect(isHttpsUrl('https://www.helloasso.com/associations/exemple')).toBe(true)
    expect(isHttpsUrl('http://www.helloasso.com/associations/exemple')).toBe(false)
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpsUrl('https://localhost')).toBe(false)
    expect(isHttpsUrl('www.helloasso.com')).toBe(false)
  })
})

describe('offerRequestSchema', () => {
  const valid = {
    offerId: '6f1c7a4e-2b7d-4c55-9a0e-3d2f5b8c1a90',
    firstName: ' Camille ',
    lastName: 'Exemple',
    email: ' Camille@Example.FR ',
    quantities: [{ tariffId: '6f1c7a4e-2b7d-4c55-9a0e-3d2f5b8c1a91', quantity: '1' }],
  }

  it('lit les quantités par tarif', () => {
    const data = form({
      offerId: valid.offerId,
      firstName: 'Camille',
      lastName: 'Exemple',
      email: 'camille@example.fr',
      [`qty.${valid.offerId}`]: '3',
    })
    expect(offerRequestSchema.parse(offerRequestFormToObject(data)).quantities).toEqual([
      { tariffId: valid.offerId, quantity: 3 },
    ])
    expect(offerRequestSchema.safeParse({ ...valid, quantities: [] }).success).toBe(false)
    expect(
      offerRequestSchema.safeParse({ ...valid, quantities: [{ tariffId: valid.offerId, quantity: '99' }] })
        .success,
    ).toBe(false)
  })

  it('normalise la saisie', () => {
    expect(offerRequestSchema.parse(valid)).toMatchObject({
      firstName: 'Camille',
      lastName: 'Exemple',
      email: 'camille@example.fr',
    })
  })

  it('exige nom, prénom et email, et détecte le champ piège', () => {
    const result = offerRequestSchema.safeParse({ ...valid, firstName: '', email: 'x', website: 'spam' })
    const paths = result.error?.issues.map((issue) => issue.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['firstName', 'email', 'website']))
  })

  it('lit les filtres de la liste du bureau', () => {
    expect(parseRequestFilters({})).toEqual({ status: 'toutes', offerId: undefined })
    expect(parseRequestFilters({ statut: 'reglees', offre: valid.offerId })).toEqual({
      status: 'reglees',
      offerId: valid.offerId,
    })
    expect(parseRequestFilters({ statut: 'inconnu', offre: '1 OR 1=1' }).offerId).toBeUndefined()
    expect(requestFiltersQuery({ status: 'a-regler', offerId: valid.offerId })).toBe(
      `?statut=a-regler&offre=${valid.offerId}`,
    )
  })
})

describe('permissions', () => {
  it('réserve le journal d’audit aux administrateurs', () => {
    expect(can('BUREAU', 'admin:access')).toBe(true)
    expect(can('BUREAU', 'requests:manage')).toBe(true)
    expect(can('BUREAU', 'audit:read')).toBe(false)
    expect(can('ADMIN', 'audit:read')).toBe(true)
  })
})
