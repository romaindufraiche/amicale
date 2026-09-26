/**
 * Sérialise des lignes en CSV (séparateur « ; » pour Excel en français).
 * Neutralise l'injection de formules : une cellule commençant par = + - @ ou une
 * tabulation est préfixée d'une apostrophe.
 */
export function toCsv(
  header: readonly string[],
  rows: readonly (readonly (string | number | null)[])[],
): string {
  const escape = (value: string | number | null): string => {
    if (value === null) return ''
    let text = String(value)
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [header, ...rows].map((row) => row.map(escape).join(';'))
  // BOM UTF-8 : Excel détecte ainsi correctement les accents.
  return `﻿${lines.join('\r\n')}\r\n`
}
