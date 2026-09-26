import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { cancelOwnOrder, changeOrderStatus, createOrder, OrderError } from '@/features/orders/service'
import { db } from '@/server/db/client'
import { auditLogs, offerTariffs, orderLines, orders } from '@/server/db/schema'
import { createMember, createOffer, resetDatabase } from '../support/db'

async function stockOf(tariffId: string) {
  const [row] = await db
    .select({ stock: offerTariffs.stock })
    .from(offerTariffs)
    .where(eq(offerTariffs.id, tariffId))
  return row?.stock
}

describe('createOrder', () => {
  beforeEach(resetDatabase)

  it('enregistre la commande avec les prix de la base et décrémente le stock', async () => {
    const member = await createMember()
    const { offer, tariffs } = await createOffer({}, [
      { label: 'Adulte', memberPriceCents: 2500, stock: 10 },
      { label: 'Enfant', memberPriceCents: 1500, stock: null },
    ])
    const [adult, child] = tariffs
    const { orderId, created } = await createOrder({
      userId: member.id,
      offerId: offer.id,
      idempotencyKey: randomUUID(),
      lines: [
        { tariffId: adult!.id, quantity: 2 },
        { tariffId: child!.id, quantity: 1 },
      ],
    })
    expect(created).toBe(true)
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
    expect(order).toMatchObject({ status: 'PENDING_PAYMENT', totalCents: 6500 })
    expect(await db.select().from(orderLines).where(eq(orderLines.orderId, orderId))).toHaveLength(2)
    expect(await stockOf(adult!.id)).toBe(8)
    expect(await stockOf(child!.id)).toBeNull()
  })

  it('est idempotent : la même clé ne crée qu’une commande, même en parallèle', async () => {
    const member = await createMember()
    const { offer, tariffs } = await createOffer()
    const input = {
      userId: member.id,
      offerId: offer.id,
      idempotencyKey: randomUUID(),
      lines: [{ tariffId: tariffs[0]!.id, quantity: 1 }],
    }
    const results = await Promise.all([createOrder(input), createOrder(input), createOrder(input)])
    expect(new Set(results.map((result) => result.orderId)).size).toBe(1)
    expect(await db.select().from(orders)).toHaveLength(1)
    expect(await stockOf(tariffs[0]!.id)).toBe(9)
  })

  it('ne survend jamais : commandes concurrentes sur le dernier stock', async () => {
    const { offer, tariffs } = await createOffer({}, [{ label: 'Place', memberPriceCents: 1000, stock: 3 }])
    const members = await Promise.all(Array.from({ length: 6 }, () => createMember()))
    const results = await Promise.allSettled(
      members.map((member) =>
        createOrder({
          userId: member.id,
          offerId: offer.id,
          idempotencyKey: randomUUID(),
          lines: [{ tariffId: tariffs[0]!.id, quantity: 1 }],
        }),
      ),
    )
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(3)
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    expect(rejected.every((result) => result.reason instanceof OrderError)).toBe(true)
    expect(await stockOf(tariffs[0]!.id)).toBe(0)
  })

  it('applique la limite par adhérent sur des commandes simultanées', async () => {
    const member = await createMember()
    const { offer, tariffs } = await createOffer({ maxPerMember: 2 }, [
      { label: 'Place', memberPriceCents: 1000, stock: null },
    ])
    const attempt = () =>
      createOrder({
        userId: member.id,
        offerId: offer.id,
        idempotencyKey: randomUUID(),
        lines: [{ tariffId: tariffs[0]!.id, quantity: 2 }],
      })
    const results = await Promise.allSettled([attempt(), attempt()])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  })

  it.each([
    ['cotisation expirée', { membershipValidUntil: '2000-01-01' }],
    ['compte suspendu', { status: 'SUSPENDED' as const }],
  ])('refuse une commande si %s', async (_label, overrides) => {
    const member = await createMember(overrides)
    const { offer, tariffs } = await createOffer()
    await expect(
      createOrder({
        userId: member.id,
        offerId: offer.id,
        idempotencyKey: randomUUID(),
        lines: [{ tariffId: tariffs[0]!.id, quantity: 1 }],
      }),
    ).rejects.toThrow(OrderError)
  })

  it('refuse une offre non publiée ou close', async () => {
    const member = await createMember()
    const draft = await createOffer({ status: 'DRAFT' })
    const closed = await createOffer({ orderDeadline: new Date(Date.now() - 60_000) })
    for (const { offer, tariffs } of [draft, closed]) {
      await expect(
        createOrder({
          userId: member.id,
          offerId: offer.id,
          idempotencyKey: randomUUID(),
          lines: [{ tariffId: tariffs[0]!.id, quantity: 1 }],
        }),
      ).rejects.toThrow(OrderError)
    }
  })

  it('refuse un tarif appartenant à une autre offre', async () => {
    const member = await createMember()
    const first = await createOffer()
    const second = await createOffer()
    await expect(
      createOrder({
        userId: member.id,
        offerId: first.offer.id,
        idempotencyKey: randomUUID(),
        lines: [{ tariffId: second.tariffs[0]!.id, quantity: 1 }],
      }),
    ).rejects.toThrow(OrderError)
  })
})

describe('annulation et changements de statut', () => {
  beforeEach(resetDatabase)

  async function placeOrder() {
    const member = await createMember()
    const { offer, tariffs } = await createOffer()
    const { orderId } = await createOrder({
      userId: member.id,
      offerId: offer.id,
      idempotencyKey: randomUUID(),
      lines: [{ tariffId: tariffs[0]!.id, quantity: 4 }],
    })
    return { member, tariffId: tariffs[0]!.id, orderId }
  }

  it('l’adhérent annule sa commande non réglée et le stock est restitué', async () => {
    const { member, tariffId, orderId } = await placeOrder()
    expect(await stockOf(tariffId)).toBe(6)
    expect(await cancelOwnOrder(member.id, orderId)).toMatchObject({ ok: true })
    expect(await stockOf(tariffId)).toBe(10)
    // Une seconde annulation ne restitue pas le stock une deuxième fois.
    expect((await cancelOwnOrder(member.id, orderId)).ok).toBe(false)
    expect(await stockOf(tariffId)).toBe(10)
  })

  it('un adhérent ne peut pas annuler la commande d’un autre (IDOR)', async () => {
    const { orderId } = await placeOrder()
    const intruder = await createMember()
    expect(await cancelOwnOrder(intruder.id, orderId)).toEqual({
      ok: false,
      message: 'Commande introuvable.',
    })
  })

  it('l’adhérent ne peut plus annuler une commande réglée', async () => {
    const { member, orderId } = await placeOrder()
    const admin = await createMember({ role: 'ADMIN' })
    await changeOrderStatus(admin.id, orderId, 'PAID')
    expect((await cancelOwnOrder(member.id, orderId)).ok).toBe(false)
  })

  it('le bureau suit le cycle réglée → remise, tracé dans le journal', async () => {
    const { orderId, tariffId } = await placeOrder()
    const admin = await createMember({ role: 'BUREAU' })
    expect((await changeOrderStatus(admin.id, orderId, 'PAID')).ok).toBe(true)
    expect((await changeOrderStatus(admin.id, orderId, 'DELIVERED')).ok).toBe(true)
    expect((await changeOrderStatus(admin.id, orderId, 'CANCELLED')).ok).toBe(false)
    expect(await stockOf(tariffId)).toBe(6)
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
    expect(order?.paidAt).toBeInstanceOf(Date)
    expect(order?.deliveredAt).toBeInstanceOf(Date)
    expect(await db.select().from(auditLogs).where(eq(auditLogs.entityId, orderId))).toHaveLength(2)
  })
})
