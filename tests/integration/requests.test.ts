import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { moveOffer } from '@/features/offers/service'
import { deletePartner, savePartner } from '@/features/partners/service'
import { countUnprocessedRequests, listRequestsForAdmin } from '@/features/requests/queries'
import {
  requestTotalCents,
  setRequestPaid,
  setRequestProcessed,
  submitOfferRequest,
} from '@/features/requests/service'
import { updateSiteSettings } from '@/features/settings/service'
import { getSiteSettings } from '@/features/settings/queries'
import { getVisitStats, recordVisit } from '@/features/visits/service'
import { db } from '@/server/db/client'
import { auditLogs, offerRequests, offers, partners, rateLimits } from '@/server/db/schema'
import { createBureauUser, createOffer, resetDatabase } from '../support/db'

const PERSON = { firstName: 'Camille', lastName: 'Exemple', email: 'camille@example.fr' }
const HELLOASSO = 'https://www.helloasso.com/associations/exemple/adhesions/adhesion-2026'

type CreatedOffer = Awaited<ReturnType<typeof createOffer>>

/** Commande de `quantity` billets sur le premier tarif de l'offre. */
function order({ offer, tariffs }: CreatedOffer, quantity = 1) {
  return {
    ...PERSON,
    offerId: offer.id,
    quantities: tariffs.map((tariff, index) => ({
      tariffId: tariff.id,
      quantity: index === 0 ? quantity : 0,
    })),
  }
}

describe('submitOfferRequest', () => {
  beforeEach(resetDatabase)

  it('enregistre la commande avec le détail des billets par tarif', async () => {
    const created = await createOffer({}, [
      { label: 'Adulte', memberPriceCents: 1000, stock: 10 },
      { label: 'Enfant', memberPriceCents: 500, stock: null },
    ])
    const input = {
      ...PERSON,
      offerId: created.offer.id,
      quantities: [
        { tariffId: created.tariffs[0]!.id, quantity: 2 },
        { tariffId: created.tariffs[1]!.id, quantity: 1 },
      ],
    }
    expect(await submitOfferRequest(input, '203.0.113.1')).toMatchObject({ ok: true })
    const rows = await db.select().from(offerRequests)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      offerId: created.offer.id,
      email: 'camille@example.fr',
      quantity: 3,
      lines: [
        { label: 'Adulte', quantity: 2, unitPriceCents: 1000 },
        { label: 'Enfant', quantity: 1, unitPriceCents: 500 },
      ],
      paidAt: null,
    })
    expect(requestTotalCents(rows[0]!.lines)).toBe(2500)
    expect(requestTotalCents([{ label: 'Ancienne commande', quantity: 2 }])).toBeNull()
  })

  it('refuse le tarif d’une autre offre, une quantité au-delà du stock et une offre sans commande', async () => {
    const first = await createOffer()
    const other = await createOffer()
    const forged = { ...order(first), quantities: [{ tariffId: other.tariffs[0]!.id, quantity: 1 }] }
    expect(await submitOfferRequest(forged, '203.0.113.5')).toEqual({ ok: false, reason: 'INVALID_TARIFF' })
    expect(await submitOfferRequest(order(first, 11), '203.0.113.5')).toEqual({ ok: false, reason: 'STOCK' })
    const noOrder = await createOffer({ orderable: false })
    expect(await submitOfferRequest(order(noOrder), '203.0.113.5')).toEqual({
      ok: false,
      reason: 'UNAVAILABLE',
    })
    expect(await db.select().from(offerRequests)).toHaveLength(0)
  })

  it('envoie un email à l’adresse de réception des commandes', async () => {
    const admin = await createBureauUser({ role: 'ADMIN' })
    await updateSiteSettings(admin.id, {
      membershipUrl: null,
      ordersEmail: 'commandes@example.org',
      membershipOpen: true,
      memberCount: null,
    })
    const created = await createOffer({ title: 'Sortie au zoo' })
    const before = Date.now()
    await submitOfferRequest(order(created, 2), '203.0.113.9')

    const dir = path.join(process.cwd(), '.outbox')
    const emails = readdirSync(dir)
      .filter((file) => statSync(path.join(dir, file)).mtimeMs >= before - 1000)
      .map(
        (file) =>
          JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as {
            to: string
            subject: string
            text?: string
          },
      )
    const sent = emails.find((email) => email.to === 'commandes@example.org')
    expect(sent?.subject).toBe('Nouvelle commande : Sortie au zoo')
    expect(JSON.stringify(sent)).toContain('camille@example.fr')
    // Les montants sont formatés avec une espace insécable avant « € ».
    expect(sent?.text).toMatch(/2 × Adulte \(10,00\s€\)/)
    expect(sent?.text).toMatch(/Total : 20,00\s€/)
  })

  it('refuse une offre non publiée, complète ou close', async () => {
    const draft = await createOffer({ status: 'DRAFT' })
    const soldOut = await createOffer({}, [{ label: 'Adulte', memberPriceCents: 1000, stock: 0 }])
    const closed = await createOffer({ orderDeadline: new Date(Date.now() - 60_000) })
    for (const offer of [draft, soldOut, closed]) {
      expect(await submitOfferRequest(order(offer), '203.0.113.2')).toEqual({
        ok: false,
        reason: 'UNAVAILABLE',
      })
    }
    expect(await db.select().from(offerRequests)).toHaveLength(0)
  })

  it('limite le nombre de demandes par adresse IP', async () => {
    const created = await createOffer({}, [{ label: 'Adulte', memberPriceCents: 1000, stock: null }])
    for (let index = 0; index < 10; index += 1) {
      expect((await submitOfferRequest(order(created), '203.0.113.3')).ok).toBe(true)
    }
    expect(await submitOfferRequest(order(created), '203.0.113.3')).toMatchObject({
      ok: false,
      reason: 'RATE_LIMITED',
    })
  })
})

describe('setRequestProcessed', () => {
  beforeEach(resetDatabase)

  it('marque une commande traitée puis non traitée, indépendamment du règlement', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const created = await createOffer()
    await submitOfferRequest(order(created), '203.0.113.4')
    const [request] = await db.select().from(offerRequests)
    if (!request) throw new Error('request not created')
    expect(await countUnprocessedRequests()).toBe(1)

    expect(await setRequestProcessed(admin.id, request.id, true)).toBe(true)
    expect(await setRequestProcessed(admin.id, request.id, true)).toBe(false)
    expect(await countUnprocessedRequests()).toBe(0)
    expect(await listRequestsForAdmin({ status: 'traitees' })).toHaveLength(1)
    expect(await listRequestsForAdmin({ status: 'a-traiter' })).toHaveLength(0)
    // Traitée ne veut pas dire réglée.
    expect(await listRequestsForAdmin({ status: 'a-regler' })).toHaveLength(1)

    expect(await setRequestProcessed(admin.id, request.id, false)).toBe(true)
    expect(await listRequestsForAdmin({ status: 'a-traiter' })).toHaveLength(1)
    const actions = (await db.select().from(auditLogs)).map((entry) => entry.action)
    expect(actions).toEqual(expect.arrayContaining(['offer_request.processed', 'offer_request.unprocessed']))
  })
})

describe('compteur de visites', () => {
  beforeEach(resetDatabase)

  const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36'

  it('compte une visite par personne et par demi-heure, sans les robots', async () => {
    expect(await recordVisit('203.0.113.1', BROWSER)).toBe(true)
    expect(await recordVisit('203.0.113.1', BROWSER)).toBe(false)
    expect(await recordVisit('203.0.113.2', BROWSER)).toBe(true)
    expect(await recordVisit('203.0.113.3', 'Googlebot/2.1')).toBe(false)
    expect(await recordVisit('203.0.113.4', null)).toBe(false)
    expect(await getVisitStats()).toEqual({ today: 2, last7Days: 2, last30Days: 2, total: 2 })
    // Aucune adresse IP n'est conservée.
    const keys = (await db.select().from(rateLimits)).map((row) => row.key)
    expect(keys.join()).not.toContain('203.0.113')
  })
})

describe('setRequestPaid', () => {
  beforeEach(resetDatabase)

  it('note puis retire le paiement, avec trace dans le journal', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const created = await createOffer()
    const { offer } = created
    await submitOfferRequest(order(created), '203.0.113.4')
    const [request] = await db.select().from(offerRequests)
    if (!request) throw new Error('request not created')

    expect(await setRequestPaid(admin.id, request.id, true)).toBe(true)
    // Déjà noté : pas de seconde mise à jour.
    expect(await setRequestPaid(admin.id, request.id, true)).toBe(false)
    expect(await listRequestsForAdmin({ status: 'a-regler' })).toHaveLength(0)
    expect(await listRequestsForAdmin({ status: 'reglees', offerId: offer.id })).toHaveLength(1)

    expect(await setRequestPaid(admin.id, request.id, false)).toBe(true)
    const [row] = await db.select().from(offerRequests).where(eq(offerRequests.id, request.id))
    expect(row?.paidAt).toBeNull()
    const actions = (await db.select().from(auditLogs)).map((entry) => entry.action)
    expect(actions).toEqual(expect.arrayContaining(['offer_request.paid', 'offer_request.unpaid']))
  })
})

describe('réglages du site', () => {
  beforeEach(resetDatabase)

  it('crée puis met à jour la ligne unique de réglages', async () => {
    const admin = await createBureauUser({ role: 'ADMIN' })
    expect(await getSiteSettings()).toEqual({
      membershipUrl: null,
      ordersEmail: null,
      membershipOpen: true,
      memberCount: null,
    })
    await updateSiteSettings(admin.id, {
      membershipUrl: HELLOASSO,
      ordersEmail: null,
      membershipOpen: true,
      memberCount: null,
    })
    await updateSiteSettings(admin.id, {
      membershipUrl: `${HELLOASSO}/adhesion`,
      ordersEmail: 'tresorier@example.org',
      membershipOpen: false,
      memberCount: 412,
    })
    expect(await getSiteSettings()).toEqual({
      membershipUrl: `${HELLOASSO}/adhesion`,
      ordersEmail: 'tresorier@example.org',
      membershipOpen: false,
      memberCount: 412,
    })
  })
})

describe('ordre d’affichage', () => {
  beforeEach(resetDatabase)

  it('échange une offre avec sa voisine de la même catégorie', async () => {
    const admin = await createBureauUser()
    const first = await createOffer({ category: 'SPORT', position: 1 })
    const second = await createOffer({ category: 'SPORT', position: 2 })
    await createOffer({ category: 'CINEMA', position: 3 })
    expect(await moveOffer(admin.id, first.offer.id, 'up')).toBe(false)
    expect(await moveOffer(admin.id, first.offer.id, 'down')).toBe(true)
    const rows = await db.select({ id: offers.id, position: offers.position }).from(offers)
    const position = (id: string) => rows.find((row) => row.id === id)?.position
    expect(position(first.offer.id)).toBe(2)
    expect(position(second.offer.id)).toBe(1)
    // La dernière offre de sa catégorie ne descend pas dans une autre catégorie.
    expect(await moveOffer(admin.id, first.offer.id, 'down')).toBe(false)
  })

  it('supprime un partenaire', async () => {
    const admin = await createBureauUser()
    const id = await savePartner(admin.id, null, {
      name: 'Partenaire test',
      category: 'SPORT',
      advantage: null,
      description: null,
      howToBenefit: null,
      websiteUrl: null,
      imageId: null,
      attachmentId: null,
      published: true,
    })
    expect(id).not.toBeNull()
    expect(await deletePartner(admin.id, id!)).toBe(true)
    expect(await db.select().from(partners)).toHaveLength(0)
    expect(await deletePartner(admin.id, id!)).toBe(false)
  })
})
