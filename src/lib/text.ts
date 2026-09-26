/**
 * Découpe un texte brut saisi dans le back-office en paragraphes.
 * Les contenus sont stockés en texte brut et rendus par React (échappement automatique) :
 * aucun HTML fourni par un utilisateur n'est jamais injecté dans la page.
 */
export function toParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
