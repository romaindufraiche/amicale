import { beforeEach, describe, expect, it } from 'vitest'
import { listPublishedClassifieds } from '@/features/classifieds/queries'
import { classifiedSchema } from '@/features/classifieds/schemas'
import { deleteClassified, saveClassified } from '@/features/classifieds/service'
import { db } from '@/server/db/client'
import { auditLogs } from '@/server/db/schema'
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
