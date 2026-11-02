import { writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { buildMemberCardPdf } from '@/features/member-cards/pdf'
import { memberCardSchema } from '@/features/member-cards/schemas'

const MM = 72 / 25.4

describe('carte d’adhérent (PDF)', () => {
  const input = memberCardSchema.parse({ lastName: ' Martin-Dupont ', firstName: 'Élodie' })

  it('produit une page au format carte bancaire', async () => {
    const bytes = await buildMemberCardPdf({ ...input, number: 42 }, '2027', 'carte')
    if (process.env.CARD_PREVIEW_DIR) writeFileSync(`${process.env.CARD_PREVIEW_DIR}/carte.pdf`, bytes)
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(1)
    const { width, height } = doc.getPage(0).getSize()
    expect(width).toBeCloseTo(85.6 * MM, 1)
    expect(height).toBeCloseTo(54 * MM, 1)
    expect(doc.getTitle()).toContain('Élodie MARTIN-DUPONT')
  })

  it('produit une page A4 avec la carte à découper', async () => {
    const bytes = await buildMemberCardPdf({ ...input, number: 42 }, '2026-2027', 'a4')
    if (process.env.CARD_PREVIEW_DIR) writeFileSync(`${process.env.CARD_PREVIEW_DIR}/a4.pdf`, bytes)
    const { width, height } = (await PDFDocument.load(bytes)).getPage(0).getSize()
    expect(width).toBeCloseTo(210 * MM, 1)
    expect(height).toBeCloseTo(297 * MM, 1)
  })

  it('refuse les noms vides ou contenant des caractères spéciaux', () => {
    expect(memberCardSchema.safeParse({ lastName: '', firstName: 'Léa' }).success).toBe(false)
    expect(memberCardSchema.safeParse({ lastName: '<script>', firstName: 'Léa' }).success).toBe(false)
    expect(memberCardSchema.parse({ lastName: "d'Artagnan", firstName: 'Jean  Paul' })).toEqual({
      lastName: 'd’Artagnan',
      firstName: 'Jean Paul',
    })
  })
})
