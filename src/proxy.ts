import { NextResponse, type NextRequest } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'
const SESSION_COOKIES = ['__Host-amicale_session', 'amicale_session']
const SESSION_TTL_SECONDS = 14 * 24 * 60 * 60

function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Les attributs `style` générés par React et next/font nécessitent 'unsafe-inline'.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

/**
 * Exécuté avant chaque rendu de page :
 * - génère un nonce et la Content-Security-Policy associée ;
 * - attribue un identifiant de requête (corrélation des logs) ;
 * - prolonge la durée de vie du cookie de session (la validité réelle
 *   de la session est toujours vérifiée en base côté serveur).
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = contentSecurityPolicy(nonce)
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-request-id', requestId)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-request-id', requestId)

  for (const name of SESSION_COOKIES) {
    const token = request.cookies.get(name)?.value
    if (token && request.method === 'GET') {
      response.cookies.set(name, token, {
        httpOnly: true,
        secure: name.startsWith('__Host-'),
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|brand/|offres/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
