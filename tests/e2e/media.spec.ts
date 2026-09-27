import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import { login } from './helpers'

test('le bureau ajoute une image à une offre par glisser-déposer', async ({ page }) => {
  const png = await sharp({ create: { width: 1200, height: 675, channels: 3, background: '#24466f' } })
    .png()
    .toBuffer()

  await login(page, 'bureau@demo.local')
  await page.goto('/admin/offres')
  await page.getByRole('link', { name: 'Aquarium et tunnel des requins' }).click()

  // Glisser-déposer simulé : un événement « drop » portant le fichier.
  const dropzone = page.getByRole('group', { name: /Visuel de l’offre/ })
  const dataTransfer = await page.evaluateHandle((base64) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    const transfer = new DataTransfer()
    transfer.items.add(new File([bytes], 'aquarium.png', { type: 'image/png' }))
    return transfer
  }, png.toString('base64'))
  await dropzone.dispatchEvent('drop', { dataTransfer })

  await expect(page.getByAltText('Aperçu de l’image')).toBeVisible()
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page.getByText('Offre enregistrée.')).toBeVisible()

  await page.goto('/espace/billetterie?categorie=FAMILLE')
  const card = page.getByRole('article').filter({ hasText: 'Aquarium et tunnel des requins' })
  const image = card.locator('img')
  await expect(image).toHaveAttribute('src', /\/media\/[0-9a-f-]+/)
  const response = await page.request.get((await image.getAttribute('src'))!)
  expect(response.headers()['content-type']).toBe('image/webp')
})

test('un visiteur non autorisé ne peut pas téléverser d’image', async ({ page }) => {
  await login(page, 'adherent@demo.local')
  expect((await page.goto('/admin/offres'))?.status()).toBe(404)
})
