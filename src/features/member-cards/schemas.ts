import { z } from 'zod'

/** Nom ou prénom : lettres (accents compris), espaces, traits d'union et apostrophes. */
const namePart = (label: string) =>
  z
    .string({ error: `${label} requis.` })
    .trim()
    .transform((value) => value.replace(/\s+/g, ' ').replace(/'/g, '’'))
    .pipe(
      z
        .string()
        .min(1, { error: `${label} requis.` })
        .max(40, { error: '40 caractères maximum.' })
        .regex(/^[\p{L}][\p{L} ’.-]*$/u, {
          error: `${label} : lettres, espaces, traits d’union uniquement.`,
        }),
    )

export const memberCardSchema = z.object({
  lastName: namePart('Nom'),
  firstName: namePart('Prénom'),
})

export type MemberCardInput = z.output<typeof memberCardSchema>

export const CARD_LAYOUTS = ['carte', 'a4'] as const
export type CardLayout = (typeof CARD_LAYOUTS)[number]

/** Nom de famille en capitales, prénom tel que saisi. */
export function displayNames(input: MemberCardInput) {
  return { lastName: input.lastName.toLocaleUpperCase('fr-FR'), firstName: input.firstName }
}

/** Clé de recherche d'un adhérent : minuscules, sans accents ni espaces superflus. */
export function nameKey(input: MemberCardInput) {
  const clean = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr-FR')
      .replace(/[’'.-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  return `${clean(input.lastName)}|${clean(input.firstName)}`
}

/** Numéro d'adhérent affiché : « 0042 ». */
export function formatMemberNumber(number: number) {
  return String(number).padStart(4, '0')
}
