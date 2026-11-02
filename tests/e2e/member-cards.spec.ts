import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('le bureau crée une carte d’adhérent numérotée, la télécharge et exporte le listing', async ({
  page,
}) => {
  // Nom unique sans chiffres (refusés dans un nom).
  const suffix = [...Date.now().toString(36)]
    .map((char) => String.fromCharCode(97 + (parseInt(char, 36) % 26)))
    .join('')
  const lastName = `Testeur${suffix}`
  await login(page, 'bureau@demo.local')
  await page.goto('/admin/cartes')
  await page.getByLabel('Nom', { exact: true }).fill(lastName)
  await page.getByLabel('Prénom').fill('Élodie')
  await page.getByRole('button', { name: 'Créer la carte' }).click()
  await expect(page.getByRole('heading', { name: /^Carte créée : N° \d{4}$/ })).toBeVisible()

  const pdf = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Carte seule (PDF)' }).click()
  expect((await pdf).suggestedFilename()).toBe(`carte-adherent-${lastName.toLowerCase()}-elodie.pdf`)

  // Même adhérent : même numéro, carte renouvelée.
  const number = (await page.getByRole('heading', { name: /^Carte créée/ }).innerText()).match(/\d{4}/)![0]
  await page.getByLabel('Nom', { exact: true }).fill(lastName.toUpperCase())
  await page.getByLabel('Prénom').fill('elodie')
  await page.getByRole('button', { name: 'Créer la carte' }).click()
  await expect(page.getByRole('heading', { name: new RegExp(`garde le N° ${number}`) })).toBeVisible()

  const csv = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Exporter le listing (CSV)' }).click()
  const content = Buffer.concat(await (await (await csv).createReadStream()).toArray()).toString('utf8')
  expect(content).toContain(`${number};${lastName.toUpperCase()};Élodie`)
})
