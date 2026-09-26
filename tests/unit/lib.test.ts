import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/csv'
import { formatDate, fromParisDateTimeInput, parisDay, toParisDateTimeInput } from '@/lib/dates'
import { centsToInput, formatEuros, formatPrice, parseEurosToCents } from '@/lib/money'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { slugify } from '@/lib/slug'
import { toParagraphs } from '@/lib/text'

describe('money', () => {
  it.each([
    ['12', 1200],
    ['12,5', 1250],
    ['12.50', 1250],
    [' 1 250,00 € ', 125000],
    ['0', 0],
  ])('convertit « %s » en %i centimes', (input, cents) => expect(parseEurosToCents(input)).toBe(cents))

  it.each(['', 'abc', '-3', '1,234', '12,'])('refuse « %s »', (input) =>
    expect(parseEurosToCents(input)).toBeNull(),
  )

  it('formate en euros à la française', () => {
    expect(formatEuros(1250).replace(/\s/g, ' ')).toBe('12,50 €')
    expect(centsToInput(1250)).toBe('12,50')
    expect(centsToInput(null)).toBe('')
    expect(formatPrice(0)).toBe('Gratuit')
  })
})

describe('dates (heure de Paris)', () => {
  it('interprète une saisie en heure d’été et d’hiver', () => {
    expect(fromParisDateTimeInput('2026-07-01T20:30')?.toISOString()).toBe('2026-07-01T18:30:00.000Z')
    expect(fromParisDateTimeInput('2026-01-15T20:30')?.toISOString()).toBe('2026-01-15T19:30:00.000Z')
  })
  it('fait l’aller-retour saisie → instant → saisie', () => {
    const date = fromParisDateTimeInput('2026-10-25T09:15')
    expect(date && toParisDateTimeInput(date)).toBe('2026-10-25T09:15')
  })
  it('refuse une saisie invalide', () => expect(fromParisDateTimeInput('2026-13-01T10:00')).toBeNull())
  it('calcule le jour à Paris', () => expect(parisDay(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01'))
  it('formate une date calendaire sans décalage', () =>
    expect(formatDate('2026-12-31')).toBe('31 décembre 2026'))
})

describe('safeRedirectPath', () => {
  it.each([
    ['/espace/commandes', '/espace/commandes'],
    ['/espace?x=1#a', '/espace?x=1#a'],
    ['https://evil.example', '/espace'],
    ['//evil.example', '/espace'],
    ['/\\evil.example', '/espace'],
    ['javascript:alert(1)', '/espace'],
    [undefined, '/espace'],
  ])('%s → %s', (input, expected) => expect(safeRedirectPath(input)).toBe(expected))
})

describe('slugify', () => {
  it('produit une adresse lisible', () =>
    expect(slugify('Arbre de Noël 2026 : l’après-midi !')).toBe('arbre-de-noel-2026-lapres-midi'))
})

describe('toCsv', () => {
  it('échappe séparateurs et guillemets et neutralise les formules', () => {
    const csv = toCsv(
      ['a', 'b'],
      [
        ['=SUM(A1)', 'x;"y"'],
        [null, 3],
      ],
    )
    expect(csv).toBe('﻿a;b\r\n\'=SUM(A1);"x;""y"""\r\n;3\r\n')
  })
})

describe('toParagraphs', () => {
  it('découpe sur les lignes vides', () =>
    expect(toParagraphs('Un\r\n\r\nDeux\nsuite\n\n\n')).toEqual(['Un', 'Deux\nsuite']))
})
