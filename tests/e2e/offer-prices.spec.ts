import { expect, test } from '@playwright/test'
import { login, logout } from './helpers'

test('le bureau masque les tarifs d’une offre sur le site', async ({ page }) => {
  // Tarifs visibles par défaut.
  await page.goto('/offres/thermes-et-spa')
  await expect(page.getByText('Tarif adhérent :').first()).toBeAttached()

  await login(page, 'bureau@demo.local')
  await page.goto('/admin/offres')
  await page.getByRole('link', { name: 'Thermes et spa — accès 3 heures' }).click()
  await page.getByLabel(/Afficher les tarifs sur le site/).uncheck()
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page).toHaveURL(/enregistree=1/)
  await page.goto('/admin/offres')
  await expect(page.getByText('Tarifs masqués sur le site').first()).toBeVisible()
  await logout(page)

  // Plus aucun prix, ni sur la fiche ni sur le catalogue ; la commande reste possible.
  await page.goto('/offres/thermes-et-spa')
  await expect(page.getByText('Les tarifs sont indiqués sur la page de paiement.')).toBeVisible()
  await expect(page.getByRole('main').getByText(/€/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Envoyer ma commande' })).toBeVisible()
  await page.goto('/offres?q=Thermes')
  const card = page.getByRole('article').filter({ hasText: 'Thermes et spa' })
  await expect(card.getByText('Tarif indiqué à la commande')).toBeVisible()
  await expect(card.getByText(/€/)).toHaveCount(0)
})
