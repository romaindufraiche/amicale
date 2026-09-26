import 'server-only'
import { count, desc, eq, isNull } from 'drizzle-orm'
import { recordAudit } from '@/features/audit/service'
import { db } from '@/server/db/client'
import { contactMessages } from '@/server/db/schema'
import { env } from '@/server/env'
import { logger } from '@/server/logger'
import { sendEmail } from '@/server/mail/transport'
import { consumeRateLimit } from '@/server/rate-limit'
import type { ContactInput } from './schemas'

export type ContactResult = { ok: true } | { ok: false; retryAfterSeconds: number }

/**
 * Enregistre le message (consultable dans l'espace bureau même si l'email échoue)
 * puis prévient le bureau, avec l'expéditeur en adresse de réponse.
 */
export async function submitContactMessage(
  input: Omit<ContactInput, 'website'>,
  clientIp: string,
): Promise<ContactResult> {
  const limit = await consumeRateLimit(`contact:ip:${clientIp}`, 5, 60 * 60 * 1000)
  if (!limit.allowed) return { ok: false, retryAfterSeconds: limit.retryAfterSeconds }

  const [saved] = await db.insert(contactMessages).values(input).returning({ id: contactMessages.id })
  logger.info('contact.received', { messageId: saved?.id })
  await sendEmail(
    env.BUREAU_EMAIL,
    {
      subject: `[Contact] ${input.subject}`,
      paragraphs: [`Message de ${input.name} (${input.email}) :`, input.message],
      action: { label: 'Voir dans l’espace bureau', url: `${env.APP_URL}/admin/messages` },
    },
    { replyTo: input.email },
  )
  return { ok: true }
}

export async function listContactMessages(onlyPending: boolean) {
  return db
    .select()
    .from(contactMessages)
    .where(onlyPending ? isNull(contactMessages.handledAt) : undefined)
    .orderBy(desc(contactMessages.createdAt))
    .limit(200)
}

export async function countPendingMessages(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(contactMessages)
    .where(isNull(contactMessages.handledAt))
  return row?.value ?? 0
}

export async function markMessageHandled(actorId: string, messageId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(contactMessages)
      .set({ handledAt: new Date(), handledById: actorId })
      .where(eq(contactMessages.id, messageId))
      .returning({ id: contactMessages.id })
    if (updated.length === 0) return false
    await recordAudit(tx, {
      actorId,
      action: 'contact.handled',
      entityType: 'contact_message',
      entityId: messageId,
    })
    return true
  })
}
