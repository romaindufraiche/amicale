const TIME_ZONE = 'Europe/Paris'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: TIME_ZONE })
const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeZone: TIME_ZONE })
const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
})
const isoDayFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TIME_ZONE,
})

/** Les dates « calendaires » (sans heure) sont stockées en `YYYY-MM-DD`. */
function toDate(value: Date | string): Date {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value)
}

export function formatDate(value: Date | string): string {
  return dateFormatter.format(toDate(value))
}

export function formatShortDate(value: Date | string): string {
  return shortDateFormatter.format(toDate(value))
}

export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(toDate(value))
}

/** Jour courant à Paris au format `YYYY-MM-DD`. */
export function parisDay(now: Date = new Date()): string {
  return isoDayFormatter.format(now)
}

/** Valeur pour un `<input type="datetime-local">`, exprimée à l'heure de Paris. */
export function toParisDateTimeInput(value: Date | null | undefined): string {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/**
 * Interprète une saisie `YYYY-MM-DDTHH:mm` comme une heure de Paris
 * (en tenant compte de l'heure d'été) et retourne l'instant UTC correspondant.
 */
export function fromParisDateTimeInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number]
  const asUtc = Date.UTC(y, mo - 1, d, h, mi)
  // Décalage de Paris à cet instant, déterminé par un aller-retour de formatage.
  const guess = new Date(asUtc)
  const offsetMs = new Date(toParisDateTimeInput(guess) + ':00Z').getTime() - asUtc
  const result = new Date(asUtc - offsetMs)
  return toParisDateTimeInput(result) === value ? result : null
}
