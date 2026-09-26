import { describe, expect, it } from 'vitest'
import {
  canTransition,
  describePricingError,
  formatOrderReference,
  priceOrder,
  releasesStockOnCancel,
} from '@/features/orders/rules'

const OFFER = 'offer-1'
const tariffs = [
  { id: 'adult', offerId: OFFER, label: 'Adulte', memberPriceCents: 2500, stock: 10, active: true },
  { id: 'child', offerId: OFFER, label: 'Enfant', memberPriceCents: 1500, stock: null, active: true },
  { id: 'inactive', offerId: OFFER, label: 'Ancien', memberPriceCents: 100, stock: null, active: false },
  { id: 'other', offerId: 'offer-2', label: 'Autre offre', memberPriceCents: 1, stock: null, active: true },
]

describe('priceOrder', () => {
  it('calcule le total à partir des prix en base', () => {
    const result = priceOrder({
      offerId: OFFER,
      requested: [
        { tariffId: 'adult', quantity: 2 },
        { tariffId: 'child', quantity: 3 },
      ],
      tariffs,
      maxPerMember: null,
      alreadyOrdered: 0,
    })
    expect(result).toEqual({
      ok: true,
      totalCents: 2 * 2500 + 3 * 1500,
      quantity: 5,
      lines: [
        { tariffId: 'adult', label: 'Adulte', unitPriceCents: 2500, quantity: 2 },
        { tariffId: 'child', label: 'Enfant', unitPriceCents: 1500, quantity: 3 },
      ],
    })
  })

  it('ignore les lignes à zéro et refuse une commande vide', () => {
    const result = priceOrder({
      offerId: OFFER,
      requested: [{ tariffId: 'adult', quantity: 0 }],
      tariffs,
      maxPerMember: null,
      alreadyOrdered: 0,
    })
    expect(result).toEqual({ ok: false, error: { code: 'EMPTY' } })
  })

  it.each(['inactive', 'other', 'unknown'])(
    'refuse le tarif %s (inactif, autre offre ou inconnu)',
    (tariffId) => {
      const result = priceOrder({
        offerId: OFFER,
        requested: [{ tariffId, quantity: 1 }],
        tariffs,
        maxPerMember: null,
        alreadyOrdered: 0,
      })
      expect(result).toEqual({ ok: false, error: { code: 'UNKNOWN_TARIFF' } })
    },
  )

  it('refuse une quantité supérieure au stock', () => {
    const result = priceOrder({
      offerId: OFFER,
      requested: [{ tariffId: 'adult', quantity: 11 }],
      tariffs,
      maxPerMember: null,
      alreadyOrdered: 0,
    })
    expect(result).toEqual({ ok: false, error: { code: 'OUT_OF_STOCK', label: 'Adulte', remaining: 10 } })
  })

  it('applique la limite par adhérent en tenant compte des commandes précédentes', () => {
    const base = { offerId: OFFER, tariffs, maxPerMember: 4 }
    expect(
      priceOrder({ ...base, requested: [{ tariffId: 'child', quantity: 2 }], alreadyOrdered: 2 }).ok,
    ).toBe(true)
    expect(
      priceOrder({ ...base, requested: [{ tariffId: 'child', quantity: 3 }], alreadyOrdered: 2 }),
    ).toEqual({
      ok: false,
      error: { code: 'MEMBER_LIMIT', limit: 4, alreadyOrdered: 2 },
    })
  })
})

describe('describePricingError', () => {
  it('produit des messages compréhensibles', () => {
    expect(describePricingError({ code: 'OUT_OF_STOCK', label: 'Adulte', remaining: 0 })).toBe(
      'Le tarif « Adulte » est épuisé.',
    )
    expect(describePricingError({ code: 'MEMBER_LIMIT', limit: 4, alreadyOrdered: 3 })).toContain(
      'encore en commander 1',
    )
  })
})

describe('cycle de vie des commandes', () => {
  it('autorise uniquement les transitions prévues', () => {
    expect(canTransition('PENDING_PAYMENT', 'PAID')).toBe(true)
    expect(canTransition('PAID', 'DELIVERED')).toBe(true)
    expect(canTransition('PENDING_PAYMENT', 'DELIVERED')).toBe(false)
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false)
    expect(canTransition('CANCELLED', 'PAID')).toBe(false)
  })

  it('ne restitue le stock que pour une commande non remise', () => {
    expect(releasesStockOnCancel('PENDING_PAYMENT')).toBe(true)
    expect(releasesStockOnCancel('PAID')).toBe(true)
    expect(releasesStockOnCancel('DELIVERED')).toBe(false)
  })

  it('formate la référence', () => {
    expect(formatOrderReference(42)).toBe('C-000042')
  })
})
