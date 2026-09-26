import 'server-only'

type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

/** Clés dont la valeur n'est jamais écrite dans les logs, quelle que soit leur profondeur. */
const REDACTED_KEYS = /pass(word)?|token|secret|authorization|cookie|session|hash/i

function threshold(): number {
  const configured = process.env.LOG_LEVEL as Level | undefined
  return LEVELS[configured ?? 'info'] ?? LEVELS.info
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || typeof value !== 'object') return value
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack }
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [
      key,
      REDACTED_KEYS.test(key) ? '[redacted]' : redact(inner, depth + 1),
    ]),
  )
}

function write(level: Level, message: string, context?: Record<string, unknown>) {
  if (LEVELS[level] < threshold()) return
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  })
  // Logs structurés JSON sur stdout/stderr, collectés par l'hébergeur.
  if (level === 'error' || level === 'warn') process.stderr.write(`${line}\n`)
  else process.stdout.write(`${line}\n`)
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => write('error', message, context),
}
