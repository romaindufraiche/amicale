import type { NextConfig } from 'next'

/**
 * En-têtes de sécurité statiques. La Content-Security-Policy, qui dépend d'un nonce
 * généré à chaque requête, est posée dans `src/proxy.ts`.
 */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // La documentation du projet (README, docs/) tient lieu de consignes pour les agents.
  agentRules: false,
  serverExternalPackages: ['@node-rs/argon2', 'sharp'],
  experimental: {
    // Téléversement d'images : 4 Mo maximum par fichier après réduction dans le navigateur
    // (compatible avec la limite de 4,5 Mo des hébergeurs serverless comme Vercel).
    serverActions: { bodySizeLimit: '4.4mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
