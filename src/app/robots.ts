import type { MetadataRoute } from 'next'
import { env } from '@/server/env'

// URL publique lue à l'exécution (APP_URL), pas au build.
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/espace', '/admin', '/api'] },
    sitemap: `${env.APP_URL}/sitemap.xml`,
  }
}
