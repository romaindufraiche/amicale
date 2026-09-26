import { z } from 'zod'

export const MAX_QUANTITY_PER_LINE = 20

const quantity = z.coerce
  .number({ error: 'Quantité invalide.' })
  .int({ error: 'Quantité invalide.' })
  .min(0, { error: 'Quantité invalide.' })
  .max(MAX_QUANTITY_PER_LINE, { error: `${MAX_QUANTITY_PER_LINE} maximum par tarif.` })

export const createOrderSchema = z.object({
  offerId: z.uuid(),
  idempotencyKey: z.uuid(),
  lines: z.array(z.object({ tariffId: z.uuid(), quantity })).max(20),
})

/** Les quantités arrivent sous la forme `qty_<identifiant du tarif>=<quantité>`. */
export function parseOrderForm(formData: FormData) {
  const lines = [...formData.entries()]
    .filter(([key]) => key.startsWith('qty_'))
    .map(([key, value]) => ({
      tariffId: key.slice(4),
      quantity: typeof value === 'string' && value !== '' ? value : '0',
    }))
  return createOrderSchema.safeParse({
    offerId: formData.get('offerId'),
    idempotencyKey: formData.get('idempotencyKey'),
    lines,
  })
}

export const orderIdSchema = z.uuid()

export const changeOrderStatusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'DELIVERED', 'CANCELLED']),
})

export const ORDER_STATUSES = ['PENDING_PAYMENT', 'PAID', 'DELIVERED', 'CANCELLED'] as const
