const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** 1250 → « 12,50 € ». Les montants sont toujours manipulés en centimes. */
export function formatEuros(cents: number): string {
  return euroFormatter.format(cents / 100)
}

/**
 * Convertit une saisie en euros (« 12 », « 12,5 », « 12.50 ») en centimes.
 * Retourne `null` si la saisie n'est pas un montant positif à deux décimales au plus.
 */
export function parseEurosToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s|€/g, '').replace(',', '.')
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) return null
  const [units = '0', decimals = ''] = normalized.split('.')
  return Number(units) * 100 + Number(decimals.padEnd(2, '0'))
}

/** Format de saisie d'un montant dans un champ de formulaire : 1250 → « 12,50 ». */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}
