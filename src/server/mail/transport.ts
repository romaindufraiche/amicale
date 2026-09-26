import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '@/server/env'
import { logger } from '@/server/logger'
import { renderEmail, type EmailContent } from './render'

let smtp: Transporter | undefined

function getSmtpTransport(): Transporter {
  smtp ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  })
  return smtp
}

/**
 * Envoie un email transactionnel. Ne lève jamais d'exception : un échec d'envoi
 * est journalisé mais n'annule pas l'opération métier déjà enregistrée.
 */
export async function sendEmail(
  to: string,
  content: EmailContent,
  options: { replyTo?: string } = {},
): Promise<boolean> {
  const email = renderEmail(content)
  try {
    if (env.MAIL_TRANSPORT === 'outbox') {
      const outbox = env.MAIL_OUTBOX_DIR ?? path.join(process.cwd(), '.outbox')
      await mkdir(outbox, { recursive: true })
      const file = path.join(outbox, `${Date.now()}-${randomUUID()}.json`)
      await writeFile(
        file,
        JSON.stringify(
          { to, from: env.MAIL_FROM, replyTo: options.replyTo, ...email, action: content.action },
          null,
          2,
        ),
      )
    } else {
      await getSmtpTransport().sendMail({ from: env.MAIL_FROM, to, replyTo: options.replyTo, ...email })
    }
    logger.info('email.sent', { subject: email.subject })
    return true
  } catch (error) {
    logger.error('email.failed', { subject: email.subject, error })
    return false
  }
}
