/** Environnement des tests : base dédiée, emails écrits dans .outbox/, pas d'appel externe. */
const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:3000',
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://postgres@localhost:5432/amicale_test',
  MAIL_TRANSPORT: 'outbox',
  MAIL_FROM: 'ADPVO <no-reply@example.org>',
  BUREAU_EMAIL: 'bureau@example.org',
  LOG_LEVEL: 'error',
}
for (const [key, value] of Object.entries(defaults)) {
  if (key === 'DATABASE_URL' || process.env[key] === undefined) process.env[key] = value
}
