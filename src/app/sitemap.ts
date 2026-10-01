import type { MetadataRoute } from 'next'
import { listNewsForSitemap } from '@/features/news/queries'
import { listPublishedOffers } from '@/features/offers/queries'
import { env } from '@/server/env'

export const dynamic = 'force-dynamic'

const STATIC_PATHS = [
  '/',
  '/offres',
  '/adherer',
  '/actualites',
  '/contact',
  '/inscription',
  '/mentions-legales',
  '/confidentialite',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, offers] = await Promise.all([listNewsForSitemap(), listPublishedOffers()])
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${env.APP_URL}${path}` })),
    ...offers.map((offer) => ({ url: `${env.APP_URL}/offres/${offer.slug}`, lastModified: offer.updatedAt })),
    ...news.map((item) => ({ url: `${env.APP_URL}/actualites/${item.slug}`, lastModified: item.updatedAt })),
  ]
}
