import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  countPendingInterests,
  listClassifiedsForAdmin,
  listInterestsForClassified,
  listPublishedClassifieds,
} from '@/features/classifieds/queries'
import { classifiedInterestSchema, classifiedSchema } from '@/features/classifieds/schemas'
import {
  deleteClassified,
  saveClassified,
  setInterestProcessed,
  submitClassifiedInterest,
} from '@/features/classifieds/service'
import { db } from '@/server/db/client'
import { auditLogs, classifiedInterests, classifieds } from '@/server/db/schema'
import { createBureauUser, resetDatabase } from '../support/db'

function input(overrides: Record<string, string> = {}) {
  return classifiedSchema.parse({
    kind: 'VENTE',
    title: 'Maison à vendre',
    description: 'Belle maison avec jardin.',
    published: 'on',
    ...overrides,
  })
}

describe('annonces', () => {
  beforeEach(resetDatabase)

  it('affiche les annonces publiées, épinglées en premier, filtrables par type', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    await saveClassified(admin.id, null, input({ title: 'Ancienne vente' }))
    await saveClassified(admin.id, null, input({ kind: 'PRET', title: 'Remorque à prêter' }))
    await saveClassified(admin.id, null, input({ kind: 'TROC', title: 'Annonce épinglée', pinned: 'on' }))
    const draft = input({ title: 'Brouillon' })
    await saveClassified(admin.id, null, { ...draft, published: false })

    const all = await listPublishedClassifieds(null)
    expect(all.map((item) => item.title)).toEqual(['Annonce épinglée', 'Remorque à prêter', 'Ancienne vente'])
    expect((await listPublishedClassifieds('PRET')).map((item) => item.title)).toEqual(['Remorque à prêter'])
  })

  it('modifie puis supprime une annonce, avec trace dans le journal', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const id = await saveClassified(admin.id, null, input())
    if (!id) throw new Error('annonce non créée')
    expect(await saveClassified(admin.id, id, input({ title: 'Maison vendue' }))).toBe(id)
    expect((await listPublishedClassifieds(null))[0]?.title).toBe('Maison vendue')
    expect(await deleteClassified(admin.id, id)).toBe(true)
    expect(await deleteClassified(admin.id, id)).toBe(false)
    const actions = (await db.select().from(auditLogs)).map((entry) => entry.action)
    expect(actions).toEqual(['classified.created', 'classified.updated', 'classified.deleted'])
  })

  it('refuse un type inconnu et un titre vide', () => {
    const result = classifiedSchema.safeParse({ kind: 'ENCHERE', title: '', description: 'x' })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((issue) => issue.path[0])
    expect(paths).toEqual(expect.arrayContaining(['kind', 'title', 'description']))
  })
})

describe('« Cette annonce m’intéresse »', () => {
  beforeEach(resetDatabase)

  const contact = { lastName: 'Durand', firstName: 'Léa', email: 'lea@example.fr', phone: '06 12 34 56 78' }

  it('enregistre la demande, prévient le bureau et se traite depuis l’espace bureau', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const id = await saveClassified(admin.id, null, input())
    if (!id) throw new Error('annonce non créée')
    expect(await submitClassifiedInterest({ classifiedId: id, ...contact }, '203.0.113.9')).toEqual({
      ok: true,
    })
    const [interest] = await listInterestsForClassified(id)
    expect(interest).toMatchObject({ lastName: 'Durand', phone: '06 12 34 56 78', processedAt: null })
    expect(await countPendingInterests()).toBe(1)
    expect(await setInterestProcessed(admin.id, interest!.id, true)).toBe(id)
    expect(await countPendingInterests()).toBe(0)
    expect((await listClassifiedsForAdmin())[0]).toMatchObject({ interests: 1, pendingInterests: 0 })
  })

  it('refuse une annonce non publiée et un téléphone invalide', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const id = await saveClassified(admin.id, null, { ...input(), published: false })
    expect(await submitClassifiedInterest({ classifiedId: id!, ...contact }, '203.0.113.9')).toEqual({
      ok: false,
      reason: 'UNAVAILABLE',
    })
    const parsed = classifiedInterestSchema.safeParse({ classifiedId: id, ...contact, phone: '12' })
    expect(parsed.success).toBe(false)
  })

  it('supprime automatiquement les annonces de plus de 45 jours, avec leurs demandes', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const oldId = await saveClassified(admin.id, null, input({ title: 'Ancienne annonce' }))
    await saveClassified(admin.id, null, input({ title: 'Annonce récente' }))
    await db
      .update(classifieds)
      .set({ createdAt: new Date(Date.now() - 46 * 24 * 3600 * 1000) })
      .where(eq(classifieds.id, oldId!))
    await submitClassifiedInterest({ classifiedId: oldId!, ...contact }, '203.0.113.10')
    expect((await listPublishedClassifieds(null)).map((item) => item.title)).toEqual(['Annonce récente'])
    expect(await db.select().from(classifiedInterests)).toHaveLength(0)
  })
})
