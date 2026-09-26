import type { MetadataRoute } from 'next'
import { listNewsForSitemap } from '@/features/news/queries'
import { env } from '@/server/env'

export const dynamic = 'force-dynamic'

const STATIC_PATHS = [
  '/',
  '/adherer',
  '/actualites',
  '/contact',
  '/inscription',
  '/mentions-legales',
  '/confidentialite',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const news = await listNewsForSitemap()
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${env.APP_URL}${path}` })),
    ...news.map((item) => ({ url: `${env.APP_URL}/actualites/${item.slug}`, lastModified: item.updatedAt })),
  ]
}
