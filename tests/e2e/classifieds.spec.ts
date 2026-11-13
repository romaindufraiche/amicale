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

  // Visiteur intéressé : nom, prénom, email, téléphone.
  await page.goto('/annonces?type=pret')
  await page.getByRole('link', { name: title }).click()
  await expect(
    page.getByText('Après vérification de vos informations, l’Amicale vous enverra').first(),
  ).toBeVisible()
  await expect(page.getByText('Les annonces sont automatiquement supprimées au bout de 45 jours.')).toBeVisible()
  await page.getByLabel('Nom', { exact: true }).fill('Durand')
  await page.getByLabel('Prénom').fill('Léa')
  await page.getByLabel('Adresse mail').fill('lea@example.fr')
  await page.getByLabel('Téléphone').fill('06 12 34 56 78')
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click()
  await expect(page.getByText('Demande envoyée.')).toBeVisible()

  // Bureau : la demande apparaît sur la fiche de l'annonce et se traite.
  await page.goto('/admin/annonces')
  await expect(page.getByRole('row').filter({ hasText: title }).getByText('1 à traiter')).toBeVisible()
  await page.getByRole('link', { name: title }).click()
  const row = page.getByRole('row').filter({ hasText: 'Durand Léa' })
  await expect(row.getByText('06 12 34 56 78')).toBeVisible()
  await row.getByRole('button', { name: 'Marquer comme traitée' }).click()
  await expect(page.getByText('Demande marquée comme traitée.')).toBeVisible()
})
