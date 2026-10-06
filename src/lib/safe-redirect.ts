/**
 * N'accepte comme destination de redirection qu'un chemin interne au site,
 * pour empêcher les redirections ouvertes (`?next=https://site-malveillant`).
 */
export function safeRedirectPath(candidate: unknown, fallback = '/admin'): string {
  if (typeof candidate !== 'string') return fallback
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f]/.test(candidate)) return fallback
  try {
    const url = new URL(candidate, 'http://localhost')
    if (url.origin !== 'http://localhost') return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
