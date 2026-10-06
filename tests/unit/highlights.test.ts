import { describe, expect, it } from 'vitest'
import { highlightSchema, isAllowedLink } from '@/features/highlights/schemas'
import { whatsappUrl } from '@/lib/whatsapp'

describe('whatsappUrl', () => {
  it('construit le lien « click to chat » au format international', () => {
    expect(whatsappUrl('+33 7 68 16 98 67')).toBe('https://wa.me/33768169867')
    expect(whatsappUrl('+33 7 68 16 98 67', 'Bonjour !')).toBe('https://wa.me/33768169867?text=Bonjour%20!')
  })
})

describe('liens des posts à la une', () => {
  it.each([
    ['/offres/aquarium', true],
    ['https://exemple.fr/page', true],
    ['//evil.example', false],
    ['/\\evil.example', false],
    ['http://non-chiffre.fr', false],
    ['javascript:alert(1)', false],
  ])('%s → %s', (value, expected) => expect(isAllowedLink(value)).toBe(expected))

  const base = {
    title: 'Permanence',
    body: 'Le bureau vous accueille.',
    linkUrl: '',
    linkLabel: '',
    tone: 'RED',
    startsAt: '',
    endsAt: '',
    position: '',
    published: 'on',
  }

  it('valide un post minimal', () => {
    expect(highlightSchema.parse(base)).toMatchObject({ linkUrl: null, position: 0, published: true })
  })

  it('refuse une période inversée et un libellé sans lien', () => {
    const result = highlightSchema.safeParse({
      ...base,
      linkLabel: 'Voir',
      startsAt: '2026-10-10T10:00',
      endsAt: '2026-10-01T10:00',
    })
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['endsAt', 'linkUrl']),
    )
  })
})
