import { displayNames, type MemberCardInput } from './schemas'

/** Nom de fichier sans accents ni caractères spéciaux : « carte-adherent-martin-camille ». */
export function cardFileName(input: MemberCardInput, suffix = '') {
  const names = displayNames(input)
  return `carte-adherent-${names.lastName}-${names.firstName}${suffix}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}
