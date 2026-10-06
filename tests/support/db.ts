import { sql } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { offers, offerTariffs, users } from '@/server/db/schema'

type NewOfferTariffInput = Omit<typeof offerTariffs.$inferInsert, 'offerId' | 'position'>

export async function resetDatabase() {
  await db.execute(
    sql`truncate audit_logs, contact_messages, highlights, media, news, partners, offer_requests, site_settings, offer_tariffs, offers, user_tokens, sessions, rate_limits, users restart identity cascade`,
  )
}

let counter = 0

/** Compte du bureau (les adhérents n'ont pas de compte). */
export async function createBureauUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  counter += 1
  const [user] = await db
    .insert(users)
    .values({
      email: `bureau${counter}@test.local`,
      passwordHash: 'not-used',
      firstName: 'Test',
      lastName: `Bureau ${counter}`,
      role: 'BUREAU',
      status: 'ACTIVE',
      ...overrides,
    })
    .returning()
  if (!user) throw new Error('user not created')
  return user
}

export async function createOffer(
  overrides: Partial<typeof offers.$inferInsert> = {},
  tariffs: NewOfferTariffInput[] = [{ label: 'Adulte', memberPriceCents: 1000, stock: 10 }],
) {
  counter += 1
  const [offer] = await db
    .insert(offers)
    .values({
      slug: `offre-${counter}`,
      title: `Offre ${counter}`,
      kind: 'TICKET',
      category: 'AUTRE',
      summary: 'Résumé de test',
      description: 'Description de test suffisamment longue.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      ...overrides,
    })
    .returning()
  if (!offer) throw new Error('offer not created')
  const created = await db
    .insert(offerTariffs)
    .values(tariffs.map((tariff, position) => ({ ...tariff, offerId: offer.id, position })))
    .returning()
  return { offer, tariffs: created }
}
