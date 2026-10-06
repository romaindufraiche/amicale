import sharp from 'sharp'
import { beforeEach, describe, expect, it } from 'vitest'
import { getMedia, purgeOrphanMedia, storeImage } from '@/features/media/service'
import { db } from '@/server/db/client'
import { media } from '@/server/db/schema'
import { sql } from 'drizzle-orm'
import { createBureauUser, resetDatabase } from '../support/db'

async function photo(width: number, height: number) {
  // Photo JPEG avec des métadonnées EXIF, dont une position GPS.
  return sharp({ create: { width, height, channels: 3, background: '#d93128' } })
    .jpeg()
    .withExif({ IFD0: { Make: 'Téléphone' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '49/1 2/1 0/1' } })
    .toBuffer()
}

describe('storeImage', () => {
  beforeEach(resetDatabase)

  it('ré-encode en WebP, réduit à 1600 px et supprime les métadonnées', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const file = new File([new Uint8Array(await photo(3200, 1800))], 'photo.jpg', { type: 'image/jpeg' })
    const result = await storeImage(file, admin.id)
    expect(result).toMatchObject({ ok: true, width: 1600, height: 900 })
    if (!result.ok) return

    const stored = await getMedia(result.id)
    expect(stored?.mimeType).toBe('image/webp')
    const meta = await sharp(stored!.data).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.exif).toBeUndefined()
  })

  it('rejette un fichier qui se fait passer pour une image', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const fake = new File(['<script>alert(1)</script>'], 'image.png', { type: 'image/png' })
    expect(await storeImage(fake, admin.id)).toEqual({
      ok: false,
      message: 'Ce fichier n’est pas une image lisible.',
    })
  })

  it('rejette les formats non pris en charge et les fichiers trop lourds', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const svg = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })
    expect((await storeImage(svg, admin.id)).ok).toBe(false)
    const huge = new File([new Uint8Array(5 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' })
    expect(await storeImage(huge, admin.id)).toEqual({
      ok: false,
      message: 'Image trop lourde : 4 Mo maximum après réduction.',
    })
  })

  it('purge les images jamais rattachées après 24 h', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const file = new File([new Uint8Array(await photo(400, 300))], 'photo.jpg', { type: 'image/jpeg' })
    const result = await storeImage(file, admin.id)
    expect(result.ok).toBe(true)
    expect(await purgeOrphanMedia()).toBe(0)
    await db.update(media).set({ createdAt: sql`now() - interval '2 days'` })
    expect(await purgeOrphanMedia()).toBe(1)
  })
})
