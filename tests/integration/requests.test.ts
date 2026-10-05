import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { listRequestsForAdmin } from '@/features/requests/queries'
import { setRequestPaid, submitOfferRequest } from '@/features/requests/service'
import { updateSiteSettings } from '@/features/settings/service'
import { getSiteSettings } from '@/features/settings/queries'
import { db } from '@/server/db/client'
import { auditLogs, offerRequests } from '@/server/db/schema'
import { createMember, createOffer, resetDatabase } from '../support/db'

const PERSON = { firstName: 'Camille', lastName: 'Exemple', email: 'camille@example.fr' }
const HELLOASSO = 'https://www.helloasso.com/associations/exemple/evenements/offre'

describe('submitOfferRequest', () => {
  beforeEach(resetDatabase)

  it('enregistre la demande et renvoie le lien HelloAsso lu en base', async () => {
    const { offer } = await createOffer({ helloassoUrl: HELLOASSO })
    const result = await submitOfferRequest({ ...PERSON, offerId: offer.id }, '203.0.113.1')
    expect(result).toEqual({ ok: true, helloassoUrl: HELLOASSO })
    const rows = await db.select().from(offerRequests)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ offerId: offer.id, email: 'camille@example.fr', paidAt: null })
  })

  it('envoie un email à l’adresse de réception des commandes', async () => {
    const admin = await createMember({ role: 'ADMIN' })
    await updateSiteSettings(admin.id, { membershipUrl: null, ordersEmail: 'commandes@example.org' })
    const { offer } = await createOffer({ title: 'Sortie au zoo' })
    const before = Date.now()
    await submitOfferRequest({ ...PERSON, offerId: offer.id }, '203.0.113.9')

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
  })

  it('refuse une offre non publiée, complète ou close', async () => {
    const { offer: draft } = await createOffer({ status: 'DRAFT' })
    const { offer: soldOut } = await createOffer({}, [{ label: 'Adulte', memberPriceCents: 1000, stock: 0 }])
    const { offer: closed } = await createOffer({ orderDeadline: new Date(Date.now() - 60_000) })
    for (const offer of [draft, soldOut, closed]) {
      expect(await submitOfferRequest({ ...PERSON, offerId: offer.id }, '203.0.113.2')).toEqual({
        ok: false,
        reason: 'UNAVAILABLE',
      })
    }
    expect(await db.select().from(offerRequests)).toHaveLength(0)
  })

  it('limite le nombre de demandes par adresse IP', async () => {
    const { offer } = await createOffer()
    for (let index = 0; index < 10; index += 1) {
      expect((await submitOfferRequest({ ...PERSON, offerId: offer.id }, '203.0.113.3')).ok).toBe(true)
    }
    expect(await submitOfferRequest({ ...PERSON, offerId: offer.id }, '203.0.113.3')).toMatchObject({
      ok: false,
      reason: 'RATE_LIMITED',
    })
  })
})

describe('setRequestPaid', () => {
  beforeEach(resetDatabase)

  it('note puis retire le paiement, avec trace dans le journal', async () => {
    const admin = await createMember({ role: 'BUREAU' })
    const { offer } = await createOffer()
    await submitOfferRequest({ ...PERSON, offerId: offer.id }, '203.0.113.4')
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
    const admin = await createMember({ role: 'ADMIN' })
    expect(await getSiteSettings()).toEqual({ membershipUrl: null, ordersEmail: null })
    await updateSiteSettings(admin.id, { membershipUrl: HELLOASSO, ordersEmail: null })
    await updateSiteSettings(admin.id, {
      membershipUrl: `${HELLOASSO}/adhesion`,
      ordersEmail: 'tresorier@example.org',
    })
    expect(await getSiteSettings()).toEqual({
      membershipUrl: `${HELLOASSO}/adhesion`,
      ordersEmail: 'tresorier@example.org',
    })
  })
})
