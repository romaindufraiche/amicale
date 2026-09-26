import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { lastEmailTo, login, logout } from './helpers'

/**
 * Parcours critique complet : demande d'adhésion → confirmation de l'email →
 * validation par le bureau → commande → règlement enregistré par le bureau.
 */
test('de la demande d’adhésion à la commande réglée', async ({ page }) => {
  const email = `nouvel.adherent.${Date.now()}@example.fr`
  const password = 'ma phrase de passe de test'

  // 1. Demande d'adhésion
  await page.goto('/inscription')
  await page.getByLabel('Prénom').fill('Dominique')
  await page.getByLabel('Nom', { exact: true }).fill('Parcours')
  await page.getByLabel('Adresse email').fill(email)
  await page.getByLabel('Situation').selectOption('ACTIF')
  await page.getByLabel('Mot de passe', { exact: true }).fill(password)
  await page.getByLabel('Confirmation du mot de passe').fill(password)
  await page.getByLabel(/Je certifie/).check()
  await page.getByRole('button', { name: 'Envoyer ma demande d’adhésion' }).click()
  await expect(page.getByRole('heading', { name: 'Vérifiez votre messagerie' })).toBeVisible()

  // 2. Confirmation de l'email via le lien reçu
  const verification = await lastEmailTo(email)
  await page.goto(verification.action!.url.replace(/^https?:\/\/[^/]+/, ''))
  await expect(page.getByRole('heading', { name: 'Adresse confirmée' })).toBeVisible()

  // 3. En attente : pas d'accès à la billetterie
  await login(page, email, password)
  await expect(page.getByRole('heading', { name: /votre demande est en cours d’examen/ })).toBeVisible()
  await page.goto('/espace/billetterie')
  await expect(page).toHaveURL('/espace')
  // Un adhérent n'accède pas au back-office.
  expect((await page.goto('/admin'))?.status()).toBe(404)
  await page.goto('/espace')
  await logout(page)

  // 4. Le bureau valide la demande
  await login(page, 'bureau@demo.local')
  await page.goto('/admin/adherents?statut=PENDING_APPROVAL')
  await page.getByRole('link', { name: /PARCOURS Dominique/ }).click()
  await page.getByRole('button', { name: 'Valider l’adhésion' }).click()
  await expect(page.getByText('Adhésion validée.')).toBeVisible()
  await logout(page)

  // 5. L'adhérent commande deux billets adulte
  await login(page, email, password)
  await page.getByRole('link', { name: 'Billetterie & sorties' }).first().click()
  await page.getByRole('link', { name: 'Grand parc d’attractions' }).click()
  await page.getByLabel('Adulte').fill('2')
  await expect(page.getByText('78,00 €')).toBeVisible()
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(axe.violations.map((violation) => violation.id)).toEqual([])
  await page.getByRole('button', { name: 'Commander' }).click()
  await expect(page.getByText(/Commande C-\d{6} enregistrée/)).toBeVisible()
  await expect(page.getByText('À régler')).toBeVisible()
  const confirmation = await lastEmailTo(email)
  expect(confirmation.subject).toMatch(/Commande C-\d{6} enregistrée/)
  const reference = /C-\d{6}/.exec(confirmation.subject)![0]
  await logout(page)

  // 6. Le bureau enregistre le règlement
  await login(page, 'bureau@demo.local')
  await page.goto(`/admin/commandes?q=${reference}`)
  await page.getByRole('button', { name: 'Marquer réglée' }).click()
  await expect(page.getByText(`Commande ${reference} : réglée.`)).toBeVisible()
  await logout(page)

  // 7. L'adhérent voit sa commande réglée
  await login(page, email, password)
  await page.goto('/espace/commandes')
  await expect(page.getByText('Réglée')).toBeVisible()
})

test('un adhérent ne voit pas la commande d’un autre', async ({ page }) => {
  await login(page, 'bureau@demo.local')
  await page.goto('/espace/billetterie/cinema-e-billet')
  await page.getByLabel('Place de cinéma').fill('1')
  await page.getByRole('button', { name: 'Commander' }).click()
  await expect(page).toHaveURL(/\/espace\/commandes\/[0-9a-f-]+/)
  const orderUrl = new URL(page.url()).pathname
  await logout(page)

  await login(page, 'adherent@demo.local')
  expect((await page.goto(orderUrl))?.status()).toBe(404)
})
