import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { connection } from 'next/server'
import type { ReactNode } from 'react'
import { site } from '@/config/site'
import { env } from '@/server/env'
import './globals.css'

// Polices auto-hébergées (aucune requête vers un service tiers).
const archivo = localFont({
  src: './fonts/archivo-variable.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  display: 'swap',
  preload: true,
})

const sourceSans = localFont({
  src: [
    { path: './fonts/source-sans-3-variable.woff2', style: 'normal', weight: '200 900' },
    { path: './fonts/source-sans-3-variable-italic.woff2', style: 'italic', weight: '200 900' },
  ],
  variable: '--font-source-sans',
  display: 'swap',
})

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(env.APP_URL),
    title: { default: `${site.legalName} — ${site.shortName}`, template: `%s · ${site.shortName}` },
    description: site.description,
    applicationName: site.shortName,
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: site.legalName,
      title: site.legalName,
      description: site.description,
    },
    formatDetection: { telephone: false },
  }
}

export const viewport: Viewport = {
  themeColor: '#fbf7f0',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Rendu dynamique obligatoire : la CSP à nonce (src/proxy.ts) est propre à chaque requête.
  await connection()

  return (
    <html lang="fr" className={`${archivo.variable} ${sourceSans.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only z-50 bg-ink px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Aller au contenu
        </a>
        {env.DEMO_MODE ? (
          <p className="bg-amber-300 px-4 py-2 text-center text-sm font-semibold text-ink">
            Version de démonstration : les offres, prix et contenus sont fictifs.
          </p>
        ) : null}
        {children}
      </body>
    </html>
  )
}
