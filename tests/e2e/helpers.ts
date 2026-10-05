import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'

export const DEMO_PASSWORD = 'demo-mot-de-passe'

export async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto('/connexion')
  await page.getByLabel('Adresse email').fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/(espace|admin)/)
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Déconnexion' }).click()
  await expect(page).toHaveURL('/')
}

type OutboxEmail = { to: string; subject: string; action?: { label: string; url: string } }

/** Dernier email envoyé à une adresse (transport « outbox » des tests). */
export async function lastEmailTo(
  to: string,
  matches: (email: OutboxEmail) => boolean = () => true,
): Promise<OutboxEmail> {
  let found: OutboxEmail | undefined
  await expect
    .poll(() => {
      const dir = path.join(process.cwd(), '.outbox')
      const files = readdirSync(dir).sort().reverse()
      found = files
        .map((file) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as OutboxEmail)
        .find((email) => email.to === to && matches(email))
      return Boolean(found)
    })
    .toBe(true)
  return found as OutboxEmail
}
