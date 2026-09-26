import { expect, test } from '@playwright/test'
import { login, logout } from './helpers'

test('le bureau publie un post qui apparaît dans le bandeau « À la une »', async ({ page }) => {
  const title = `Post de test ${Date.now()}`
  await login(page, 'bureau@demo.local')
  await page.goto('/admin/a-la-une/nouveau')
  await page.getByLabel('Titre').fill(title)
  await page.getByLabel('Texte', { exact: true }).fill('Annonce publiée depuis les tests de bout en bout.')
  await page.getByLabel('Lien (facultatif)', { exact: true }).fill('/contact')
  await page.getByRole('button', { name: 'Créer le post' }).click()
  await expect(page.getByText('Post enregistré.')).toBeVisible()
  await page.goto('/espace')
  await logout(page)

  await page.goto('/')
  const banner = page.getByRole('region', { name: 'À la une' })
  await expect(banner.getByRole('heading', { name: title })).toBeVisible()
  // Le défilement peut être mis en pause (WCAG 2.2.2).
  await banner.getByRole('button', { name: 'Mettre en pause' }).click()
  await expect(banner.getByRole('button', { name: 'Reprendre le défilement' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('le bouton WhatsApp ouvre une discussion avec l’Amicale', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: /WhatsApp : écrire à l’Amicale/ })
  await expect(link).toHaveAttribute('href', /^https:\/\/wa\.me\/33768169867\?text=/)
  await expect(link).toHaveAttribute('target', '_blank')
})
