import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://postgres@localhost:5432/amicale_e2e'

/**
 * Tests de bout en bout sur le build de production (`next start`) : la CSP,
 * les cookies sécurisés et l'hydratation sont testés dans leur configuration réelle.
 * Prérequis : `pnpm build`.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: {
    command: `pnpm db:migrate && PORT=${PORT} HOSTNAME=127.0.0.1 pnpm start`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      APP_URL: `http://localhost:${PORT}`,
      MAIL_TRANSPORT: 'outbox',
      MAIL_OUTBOX_IN_PRODUCTION: 'true',
      // Le serveur autonome s'exécute depuis .next/standalone : chemin absolu requis.
      MAIL_OUTBOX_DIR: path.join(process.cwd(), '.outbox'),
      MAIL_FROM: 'ADPVO <no-reply@example.org>',
      BUREAU_EMAIL: 'bureau@example.org',
      LOG_LEVEL: 'warn',
    },
  },
})
