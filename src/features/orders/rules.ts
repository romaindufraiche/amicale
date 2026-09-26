import type { OfferTariff, OrderStatus } from '@/server/db/schema'

/**
 * Règles métier des commandes, sans accès à la base : elles sont testées
 * unitairement et appliquées par le service à l'intérieur d'une transaction.
 */

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from]
}

/** Une commande annulée restitue ses places au stock, sauf si elle a déjà été remise. */
export function releasesStockOnCancel(from: OrderStatus): boolean {
  return from === 'PENDING_PAYMENT' || from === 'PAID'
}

export function formatOrderReference(number: number): string {
  return `C-${String(number).padStart(6, '0')}`
}

export type RequestedLine = { tariffId: string; quantity: number }

type TariffForOrder = Pick<OfferTariff, 'id' | 'label' | 'memberPriceCents' | 'stock' | 'active' | 'offerId'>

export type PricedLine = {
  tariffId: string
  label: string
  unitPriceCents: number
  quantity: number
}

export type OrderPricingError =
  | { code: 'EMPTY' }
  | { code: 'UNKNOWN_TARIFF' }
  | { code: 'OUT_OF_STOCK'; label: string; remaining: number }
  | { code: 'MEMBER_LIMIT'; limit: number; alreadyOrdered: number }

export type OrderPricingResult =
  | { ok: true; lines: PricedLine[]; totalCents: number; quantity: number }
  | { ok: false; error: OrderPricingError }

/**
 * Calcule une commande à partir des tarifs en base. Le prix envoyé par le navigateur
 * n'est jamais utilisé : seuls l'identifiant du tarif et la quantité sont pris en compte.
 */
export function priceOrder(input: {
  offerId: string
  requested: readonly RequestedLine[]
  tariffs: readonly TariffForOrder[]
  maxPerMember: number | null
  alreadyOrdered: number
}): OrderPricingResult {
  const requested = input.requested.filter((line) => line.quantity > 0)
  if (requested.length === 0) return { ok: false, error: { code: 'EMPTY' } }

  const lines: PricedLine[] = []
  for (const line of requested) {
    const tariff = input.tariffs.find((candidate) => candidate.id === line.tariffId)
    if (!tariff || !tariff.active || tariff.offerId !== input.offerId) {
      return { ok: false, error: { code: 'UNKNOWN_TARIFF' } }
    }
    if (tariff.stock !== null && tariff.stock < line.quantity) {
      return { ok: false, error: { code: 'OUT_OF_STOCK', label: tariff.label, remaining: tariff.stock } }
    }
    lines.push({
      tariffId: tariff.id,
      label: tariff.label,
      unitPriceCents: tariff.memberPriceCents,
      quantity: line.quantity,
    })
  }

  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0)
  if (input.maxPerMember !== null && input.alreadyOrdered + quantity > input.maxPerMember) {
    return {
      ok: false,
      error: { code: 'MEMBER_LIMIT', limit: input.maxPerMember, alreadyOrdered: input.alreadyOrdered },
    }
  }

  const totalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  return { ok: true, lines, totalCents, quantity }
}

export function describePricingError(error: OrderPricingError): string {
  switch (error.code) {
    case 'EMPTY':
      return 'Sélectionnez au moins un billet.'
    case 'UNKNOWN_TARIFF':
      return "L'un des tarifs sélectionnés n'est plus disponible. Rechargez la page."
    case 'OUT_OF_STOCK':
      return error.remaining === 0
        ? `Le tarif « ${error.label} » est épuisé.`
        : `Il ne reste que ${error.remaining} place(s) au tarif « ${error.label} ».`
    case 'MEMBER_LIMIT': {
      const remaining = Math.max(0, error.limit - error.alreadyOrdered)
      return remaining === 0
        ? `Vous avez atteint la limite de ${error.limit} billet(s) par adhérent pour cette offre.`
        : `Cette offre est limitée à ${error.limit} billet(s) par adhérent : vous pouvez encore en commander ${remaining}.`
    }
  }
}
