import { expect, test } from '@playwright/test'
import { login, logout } from './helpers'

test('le bureau masque les tarifs d’une offre aux visiteurs non connectés', async ({ page }) => {
  // Visiteur : tarifs visibles par défaut.
  await page.goto('/offres/thermes-et-spa')
  await expect(page.getByText('Tarif adhérent :').first()).toBeAttached()

  await login(page, 'bureau@demo.local')
  await page.goto('/admin/offres')
  await page.getByRole('link', { name: 'Thermes et spa — accès 3 heures' }).click()
  await page.getByLabel(/Afficher les tarifs aux visiteurs non connectés/).uncheck()
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page).toHaveURL(/enregistree=1/)
  await page.goto('/admin/offres')
  await expect(page.getByText('Tarifs masqués aux visiteurs').first()).toBeVisible()

  // Adhérent connecté : tarifs toujours visibles.
  await page.goto('/espace/billetterie/thermes-et-spa')
  await expect(page.getByText(/\d+,\d{2}\s€/).first()).toBeVisible()
  await logout(page)

  // Visiteur : plus aucun prix, ni sur la fiche ni sur le catalogue.
  await page.goto('/offres/thermes-et-spa')
  await expect(
    page.getByText('Les tarifs de cette offre et la commande sont réservés aux adhérents.'),
  ).toBeVisible()
  await expect(page.getByRole('main').getByText(/€/)).toHaveCount(0)
  await page.goto('/offres?q=Thermes')
  const card = page.getByRole('article').filter({ hasText: 'Thermes et spa' })
  await expect(card.getByText('Tarif réservé aux adhérents')).toBeVisible()
  await expect(card.getByText(/€/)).toHaveCount(0)
})
