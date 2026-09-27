import 'server-only'
import { z } from 'zod'
import { MISSING_DATABASE_URL, resolveDatabaseUrl } from '@/lib/database-url'

/**
 * Variables d'environnement validées par un schéma : toute valeur manquante ou
 * invalide produit une erreur explicite listant les variables à corriger.
 */
const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_URL: z.url().transform((url) => url.replace(/\/$/, '')),
    DATABASE_URL: z.string({ error: MISSING_DATABASE_URL }).min(1, { error: MISSING_DATABASE_URL }),
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    MAIL_TRANSPORT: z.enum(['smtp', 'outbox']).default('outbox'),
    MAIL_FROM: z.string().min(3),
    /** Dossier de la boîte d'envoi locale (transport « outbox »). */
    MAIL_OUTBOX_DIR: z.string().optional(),
    BUREAU_EMAIL: z.email(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    /** Réservé aux tests de bout en bout sur un build de production. Jamais en exploitation. */
    MAIL_OUTBOX_IN_PRODUCTION: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    /** Connexions simultanées à la base par instance (3 conseillé en serverless). */
    DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
    /** Affiche un bandeau « version de démonstration » sur toutes les pages. */
    DEMO_MODE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  })
  .superRefine((env, ctx) => {
    if (env.MAIL_TRANSPORT === 'smtp' && !env.SMTP_HOST) {
      ctx.addIssue({ code: 'custom', path: ['SMTP_HOST'], message: 'requis lorsque MAIL_TRANSPORT=smtp' })
    }
    if (env.NODE_ENV === 'production' && env.MAIL_TRANSPORT !== 'smtp' && !env.MAIL_OUTBOX_IN_PRODUCTION) {
      ctx.addIssue({ code: 'custom', path: ['MAIL_TRANSPORT'], message: 'doit valoir "smtp" en production' })
    }
  })

export type Env = z.infer<typeof schema>

function loadEnv(): Env {
  const parsed = schema.safeParse({ ...process.env, DATABASE_URL: resolveDatabaseUrl(process.env) })
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Configuration invalide :\n${details}`)
  }
  return parsed.data
}

let cached: Env | undefined

/**
 * Validée au premier accès, pas à l'import : le build (`next build`) n'a ainsi besoin
 * d'aucun secret, et une configuration invalide fait échouer le serveur dès la première requête.
 */
export const env: Env = new Proxy({} as Env, {
  get: (_target, key) => {
    cached ??= loadEnv()
    return cached[key as keyof Env]
  },
})

export const isProduction = process.env.NODE_ENV === 'production'
