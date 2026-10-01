import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PUBLIC_PAGES = [
  '/',
  '/offres',
  '/adherer',
  '/actualites',
  '/contact',
  '/connexion',
  '/inscription',
  '/mentions-legales',
  '/confidentialite',
]

test.describe('pages publiques', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} : rendu sans erreur et sans violation d’accessibilité`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      expect(response?.headers()['content-security-policy']).toContain("script-src 'self' 'nonce-")
      await expect(page.locator('h1')).toHaveCount(1)

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
      expect(errors).toEqual([])
    })
  }

  test('404 personnalisée', async ({ page }) => {
    const response = await page.goto('/page-inexistante')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Cette page n’existe pas.' })).toBeVisible()
  })

  test('les espaces protégés redirigent vers la connexion', async ({ page }) => {
    await page.goto('/espace/billetterie')
    await expect(page).toHaveURL(/\/connexion\?next=%2Fespace/)
  })

  test('un visiteur consulte les offres sans compte, sans voir les tarifs adhérents', async ({ page }) => {
    await page.goto('/offres?categorie=PARCS')
    await expect(page.getByRole('link', { name: 'Parcs & loisirs' })).toHaveAttribute('aria-current', 'page')
    const firstOffer = page
      .getByRole('main')
      .getByRole('article')
      .first()
      .getByRole('heading')
      .getByRole('link')
    const title = await firstOffer.textContent()
    await firstOffer.click()
    await expect(page).toHaveURL(/\/offres\/[a-z0-9-]+$/)
    await expect(page.getByRole('heading', { level: 1, name: title ?? '' })).toBeVisible()
    await expect(page.getByText(/€/)).toHaveCount(0)

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])

    await page.getByRole('link', { name: 'Se connecter pour commander' }).click()
    await expect(page).toHaveURL(/\/connexion\?next=%2Fespace%2Fbilletterie%2F/)
  })

  test('le formulaire de contact enregistre le message', async ({ page }) => {
    await page.goto('/contact')
    await page.getByLabel('Nom et prénom').fill('Dominique Test')
    await page.getByLabel('Adresse email').fill('dominique@example.fr')
    await page.getByLabel('Objet').selectOption('Adhésion')
    await page.getByLabel('Votre message').fill('Bonjour, je souhaite des informations sur l’adhésion.')
    await page.getByRole('button', { name: 'Envoyer le message' }).click()
    await expect(page.getByText('Message envoyé.')).toBeVisible()
  })

  test('les erreurs de validation sont affichées et la saisie conservée', async ({ page }) => {
    await page.goto('/inscription')
    await page.getByLabel('Prénom').fill('Alex')
    await page.getByRole('button', { name: 'Envoyer ma demande d’adhésion' }).click()
    await expect(page.getByText('Certains champs sont à corriger.')).toBeVisible()
    await expect(page.getByLabel('Prénom')).toHaveValue('Alex')
    await expect(page.getByLabel('Nom', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })
})
