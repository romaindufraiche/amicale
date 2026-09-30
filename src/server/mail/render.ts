import { site } from '@/config/site'

export type EmailContent = {
  subject: string
  /** Paragraphes en texte brut (échappés pour la version HTML). */
  paragraphs: string[]
  action?: { label: string; url: string }
}

export type RenderedEmail = { subject: string; text: string; html: string }

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Gabarit unique des emails transactionnels : sobre, lisible sans images,
 * et doublé d'une version texte pour les messageries qui n'affichent pas le HTML.
 */
export function renderEmail({ subject, paragraphs, action }: EmailContent): RenderedEmail {
  const signature = `— ${site.shortName}`
  const text = [...paragraphs, ...(action ? [`${action.label} : ${action.url}`] : []), signature].join('\n\n')

  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;line-height:1.55">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#005b89;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:2px;font-weight:600">${escapeHtml(action.label)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#5c5349;line-height:1.5">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${escapeHtml(action.url)}</p>`
    : ''

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#fffaf4;font-family:Arial,Helvetica,sans-serif;color:#1b1713">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-top:4px solid #005b89">
<tr><td style="padding:28px 32px 8px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:13px;color:#005b89">${escapeHtml(site.shortName)}</td></tr>
<tr><td style="padding:8px 32px 24px;font-size:16px">
<h1 style="font-size:20px;margin:0 0 20px;line-height:1.3">${escapeHtml(subject)}</h1>
${body}${button}
<p style="margin:24px 0 0;color:#5c5349">${escapeHtml(signature)}</p>
</td></tr></table>
<p style="font-size:12px;color:#5c5349;margin:16px 0 0">Message automatique, merci de ne pas y répondre directement.</p>
</td></tr></table></body></html>`

  return { subject, text, html }
}
