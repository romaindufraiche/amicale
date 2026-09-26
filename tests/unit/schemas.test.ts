import { describe, expect, it } from 'vitest'
import { registerSchema } from '@/features/auth/schemas'
import { offerFormToObject, offerSchema } from '@/features/offers/schemas'
import { can } from '@/server/auth/permissions'
import { defaultMembershipEnd, formatMemberNumber, hasValidMembership } from '@/features/members/membership'

function form(entries: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

describe('registerSchema', () => {
  const valid = {
    firstName: ' Alex ',
    lastName: 'Exemple',
    email: ' Alex@Example.FR ',
    phone: '06 12 34 56 78',
    category: 'ACTIF',
    assignment: '',
    password: 'une phrase de passe',
    passwordConfirm: 'une phrase de passe',
    certify: 'on',
  }

  it('normalise email, téléphone et champs vides', () => {
    const parsed = registerSchema.parse(valid)
    expect(parsed).toMatchObject({
      firstName: 'Alex',
      email: 'alex@example.fr',
      phone: '0612345678',
      assignment: null,
    })
  })

  it('exige des mots de passe identiques, assez longs, et l’attestation', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'court',
      passwordConfirm: 'autre',
      certify: undefined,
    })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((issue) => issue.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['password', 'certify']))
  })
})

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
    maxPerMember: '4',
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
    expect(parsed.maxPerMember).toBe(4)
    expect(parsed.eventStartsAt?.toISOString()).toBe('2026-07-01T07:00:00.000Z')
    expect(parsed.tariffs).toEqual([
      { id: null, label: 'Adulte', memberPrice: 2550, publicPrice: 4000, stock: null, active: true },
    ])
  })

  it('exige une date pour une sortie et refuse un prix public inférieur', () => {
    const result = offerSchema.safeParse(
      offerFormToObject(form({ ...base, eventStartsAt: '', 'tariffs.0.publicPrice': '10' })),
    )
    const paths = result.error?.issues.map((issue) => issue.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['eventStartsAt', 'tariffs.0.publicPrice']))
  })
})

describe('permissions', () => {
  it('réserve la gestion des rôles et le journal aux administrateurs', () => {
    expect(can('BUREAU', 'orders:manage')).toBe(true)
    expect(can('BUREAU', 'members:roles')).toBe(false)
    expect(can('BUREAU', 'audit:read')).toBe(false)
    expect(can('MEMBER', 'admin:access')).toBe(false)
    expect(can('ADMIN', 'members:roles')).toBe(true)
  })
})

describe('adhésion', () => {
  it('vérifie statut et date de fin de cotisation (incluse)', () => {
    expect(hasValidMembership({ status: 'ACTIVE', membershipValidUntil: '2026-12-31' }, '2026-12-31')).toBe(
      true,
    )
    expect(hasValidMembership({ status: 'ACTIVE', membershipValidUntil: '2026-12-31' }, '2027-01-01')).toBe(
      false,
    )
    expect(
      hasValidMembership({ status: 'SUSPENDED', membershipValidUntil: '2099-12-31' }, '2026-01-01'),
    ).toBe(false)
    expect(hasValidMembership({ status: 'ACTIVE', membershipValidUntil: null }, '2026-01-01')).toBe(false)
  })
  it('propose le 31 décembre et formate le numéro', () => {
    expect(defaultMembershipEnd('2026-03-10')).toBe('2026-12-31')
    expect(formatMemberNumber(2026, 7)).toBe('95-2026-0007')
  })
})
