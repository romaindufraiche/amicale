import 'server-only'
import { z } from 'zod'
import { MISSING_DATABASE_URL, resolveAppUrl, resolveDatabaseUrl } from '@/lib/database-url'

/** Variable facultative : une ligne vide dans le fichier .env vaut « non renseignée ». */
const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined))

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
    /*
     * Apple Wallet (facultatif) : cartes d'adhérent ajoutables au Cartes de l'iPhone.
     * Certificats encodés en base64 (fichiers PEM), fournis par le compte Apple Developer.
     */
    APPLE_WALLET_PASS_TYPE_ID: optionalText,
    APPLE_WALLET_TEAM_ID: optionalText,
    APPLE_WALLET_CERTIFICATE: optionalText,
    APPLE_WALLET_PRIVATE_KEY: optionalText,
    APPLE_WALLET_PRIVATE_KEY_PASSPHRASE: optionalText,
    APPLE_WALLET_WWDR_CERTIFICATE: optionalText,
    /*
     * Google Wallet (facultatif) : identifiant d'émetteur et clé JSON du compte de service
     * Google Cloud (fichier encodé en base64).
     */
    GOOGLE_WALLET_ISSUER_ID: optionalText,
    GOOGLE_WALLET_SERVICE_ACCOUNT: optionalText,
    /**
     * Secret qui signe les liens personnels envoyés aux adhérents (carte en ligne, PDF,
     * Wallet), 32 caractères minimum. Sans lui, pas de lien adhérent.
     */
    WALLET_LINK_SECRET: optionalText.pipe(z.string().min(32).optional()),
  })
  .superRefine((env, ctx) => {
    const groups = {
      'Apple Wallet': [
        'APPLE_WALLET_PASS_TYPE_ID',
        'APPLE_WALLET_TEAM_ID',
        'APPLE_WALLET_CERTIFICATE',
        'APPLE_WALLET_PRIVATE_KEY',
        'APPLE_WALLET_WWDR_CERTIFICATE',
      ],
      'Google Wallet': ['GOOGLE_WALLET_ISSUER_ID', 'GOOGLE_WALLET_SERVICE_ACCOUNT'],
    } as const
    for (const [label, keys] of Object.entries(groups)) {
      const provided = keys.filter((key) => env[key])
      if (provided.length === 0) continue
      for (const key of [...keys, 'WALLET_LINK_SECRET' as const].filter((name) => !env[name])) {
        ctx.addIssue({ code: 'custom', path: [key], message: `requis pour activer ${label}` })
      }
    }
    if (env.MAIL_TRANSPORT === 'smtp' && !env.SMTP_HOST) {
      ctx.addIssue({ code: 'custom', path: ['SMTP_HOST'], message: 'requis lorsque MAIL_TRANSPORT=smtp' })
    }
    if (env.NODE_ENV === 'production' && env.MAIL_TRANSPORT !== 'smtp' && !env.MAIL_OUTBOX_IN_PRODUCTION) {
      ctx.addIssue({ code: 'custom', path: ['MAIL_TRANSPORT'], message: 'doit valoir "smtp" en production' })
    }
  })

export type Env = z.infer<typeof schema>

function loadEnv(): Env {
  const parsed = schema.safeParse({
    ...process.env,
    DATABASE_URL: resolveDatabaseUrl(process.env),
    APP_URL: resolveAppUrl(process.env),
  })
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
