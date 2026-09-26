import { describe, expect, it } from 'vitest'
import { bestSavingPercent, lowestMemberPrice, offerAvailability } from '@/features/offers/rules'

const now = new Date('2026-06-15T10:00:00Z')
const today = '2026-06-15'
const open = {
  status: 'PUBLISHED',
  kind: 'TICKET',
  orderDeadline: null,
  eventStartsAt: null,
  validUntil: null,
} as const
const tariffs = [{ stock: 5, active: true }]

describe('offerAvailability', () => {
  it('ouvre une offre publiée avec du stock', () => {
    expect(offerAvailability(open, tariffs, now, today)).toEqual({ open: true })
  })

  it.each([
    [{ ...open, status: 'DRAFT' as const }, 'NOT_PUBLISHED'],
    [{ ...open, orderDeadline: new Date('2026-06-15T09:59:00Z') }, 'DEADLINE_PASSED'],
    [{ ...open, kind: 'EVENT' as const, eventStartsAt: new Date('2026-06-14T10:00:00Z') }, 'EVENT_PASSED'],
    [{ ...open, validUntil: '2026-06-14' }, 'EXPIRED'],
  ])('ferme les commandes (%#)', (offer, reason) => {
    expect(offerAvailability(offer, tariffs, now, today)).toEqual({ open: false, reason })
  })

  it('considère une offre complète quand tous les tarifs actifs sont épuisés', () => {
    expect(
      offerAvailability(
        open,
        [
          { stock: 0, active: true },
          { stock: null, active: false },
        ],
        now,
        today,
      ),
    ).toEqual({
      open: false,
      reason: 'SOLD_OUT',
    })
    expect(
      offerAvailability(
        open,
        [
          { stock: 0, active: true },
          { stock: null, active: true },
        ],
        now,
        today,
      ).open,
    ).toBe(true)
  })

  it('reste valable le dernier jour de validité', () => {
    expect(offerAvailability({ ...open, validUntil: today }, tariffs, now, today).open).toBe(true)
  })
})

describe('prix affichés', () => {
  const list = [
    { memberPriceCents: 3900, publicPriceCents: 6200, active: true },
    { memberPriceCents: 3200, publicPriceCents: 5500, active: true },
    { memberPriceCents: 100, publicPriceCents: 10000, active: false },
  ]
  it('retient le plus petit prix actif', () => expect(lowestMemberPrice(list)).toBe(3200))
  it('calcule la meilleure économie arrondie à l’inférieur', () => expect(bestSavingPercent(list)).toBe(41))
  it('ne calcule pas d’économie sans prix public', () =>
    expect(bestSavingPercent([{ memberPriceCents: 10, publicPriceCents: null, active: true }])).toBeNull())
})
