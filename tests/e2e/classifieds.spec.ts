import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('le bureau publie une annonce, visible dans la rubrique Annonces', async ({ page }) => {
  const title = `Remorque à prêter ${Date.now()}`
  await login(page, 'bureau@demo.local')
  await page.goto('/admin/annonces/nouveau')
  await page.getByLabel('Type d’annonce').selectOption('PRET')
  await page.getByLabel('Titre').fill(title)
  await page.getByLabel('Description').fill('Remorque 750 kg, disponible le week-end. Contacter le bureau.')
  await page.getByRole('button', { name: 'Publier l’annonce' }).click()
  await expect(page.getByText('Annonce enregistrée.')).toBeVisible()

  await page.goto('/annonces?type=pret')
  await expect(page.getByRole('link', { name: 'Prêt', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('link', { name: title }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()

  await page.goto('/annonces?type=vente')
  await expect(page.getByRole('link', { name: title })).toHaveCount(0)
})
