import { beforeEach, describe, expect, it } from 'vitest'
import { formatMemberNumber, memberCardSchema } from '@/features/member-cards/schemas'
import { deleteMember, issueMemberCard, listMembers } from '@/features/member-cards/service'
import { db } from '@/server/db/client'
import { auditLogs } from '@/server/db/schema'
import { createBureauUser, resetDatabase } from '../support/db'

const card = (lastName: string, firstName: string) => memberCardSchema.parse({ lastName, firstName })

describe('listing des adhérents', () => {
  beforeEach(resetDatabase)

  it('numérote les nouveaux adhérents et garde le numéro au renouvellement', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const first = await issueMemberCard(admin.id, card('Martin', 'Camille'), '2027')
    const second = await issueMemberCard(admin.id, card('Durand', 'Léa'), '2027')
    expect(first.created).toBe(true)
    expect(second.member.number).toBe(first.member.number + 1)

    // Même personne, saisie un peu différente (casse, accents) : même numéro, nouvelle saison.
    const renewed = await issueMemberCard(admin.id, card('MARTIN', 'camille'), '2028')
    expect(renewed.created).toBe(false)
    expect(renewed.member.number).toBe(first.member.number)
    expect(renewed.member.season).toBe('2028')
    expect(renewed.member.lastName).toBe('Martin')
    expect(await listMembers()).toHaveLength(2)

    expect(await deleteMember(admin.id, second.member.id)).toBe(true)
    expect(await listMembers()).toHaveLength(1)
    const actions = (await db.select().from(auditLogs)).map((entry) => entry.action)
    expect(actions).toEqual(expect.arrayContaining(['member.created', 'member.renewed', 'member.deleted']))
    expect(formatMemberNumber(7)).toBe('0007')
  })
})
