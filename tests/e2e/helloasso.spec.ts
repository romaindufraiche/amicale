import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { login, logout } from './helpers'

const MEMBERSHIP_URL = 'https://www.helloasso.com/associations/exemple/adhesions/adhesion-2026'
const OFFER_URL = 'https://www.helloasso.com/associations/exemple/evenements/aquarium'

test('adhésion et commande via HelloAsso, suivi des demandes par le bureau', async ({ page }) => {
  await login(page, 'bureau@demo.local')
  await expect(page).toHaveURL('/admin')

  // Lien d'adhésion, utilisé par tous les boutons « Adhérer ».
  await page.goto('/admin/reglages')
  await page.getByLabel('Lien HelloAsso d’adhésion').fill('http://non-securise.fr')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(
    page.getByText('Adresse invalide : collez le lien complet, commençant par https://'),
  ).toBeVisible()
  await page.getByLabel('Lien HelloAsso d’adhésion').fill(MEMBERSHIP_URL)
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText('Réglages enregistrés.')).toBeVisible()

  // Lien de paiement propre à une offre.
  await page.goto('/admin/offres')
  await page.getByRole('link', { name: 'Aquarium et tunnel des requins' }).click()
  await page.getByLabel('Lien HelloAsso de paiement').fill(OFFER_URL)
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page).toHaveURL(/enregistree=1/)
  await page.goto('/admin')
  await logout(page)

  // Visiteur : boutons « Adhérer » vers HelloAsso.
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Adhérer à l’Amicale' }).first()).toHaveAttribute(
    'href',
    MEMBERSHIP_URL,
  )

  // Visiteur : commande en deux temps.
  const lastName = `Testeur${Date.now()}`
  await page.goto('/offres/aquarium')
  await page.getByRole('button', { name: 'Commander' }).click()
  await expect(page.getByText('Certains champs sont à corriger.')).toBeVisible()
  await page.getByLabel('Prénom').fill('Camille')
  await page.getByLabel('Nom', { exact: true }).fill(lastName)
  await page.getByLabel('Adresse email').fill('camille@example.fr')
  await page.getByRole('button', { name: 'Commander' }).click()
  await expect(page.getByText('Vos coordonnées sont enregistrées.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Continuer vers le paiement' })).toHaveAttribute(
    'href',
    OFFER_URL,
  )
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])

  // Bureau : la demande apparaît, le paiement est noté, l'export la contient.
  await login(page, 'bureau@demo.local')
  await page.goto('/admin/demandes')
  const row = page.getByRole('row').filter({ hasText: lastName })
  await expect(row.getByText('Non constaté')).toBeVisible()
  await row.getByRole('button', { name: 'Marquer comme réglée' }).click()
  await expect(page.getByText('Paiement noté.')).toBeVisible()
  await expect(row.getByText(/^Réglée le/)).toBeVisible()
  await page.goto('/admin/demandes?statut=reglees')
  await expect(page.getByRole('row').filter({ hasText: lastName })).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Exporter (CSV)' }).click()
  const file = await download
  const csv = await (await file.createReadStream()).toArray()
  expect(Buffer.concat(csv).toString('utf8')).toContain(lastName)
})
