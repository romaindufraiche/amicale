import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/ui/action-form'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { markMessageHandledAction } from '@/features/contact/actions'
import { listContactMessages } from '@/features/contact/service'
import { formatDateTime } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Messages' }

type Props = { searchParams: Promise<{ tous?: string }> }

export default async function MessagesPage({ searchParams }: Props) {
  await requirePermission('messages:manage', '/admin/messages')
  const showAll = (await searchParams).tous === '1'
  const messages = await listContactMessages(!showAll)

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Messages"
        lead="Messages reçus via le formulaire de contact. Répondez depuis votre messagerie."
        actions={
          <Link
            href={showAll ? '/admin/messages' : '/admin/messages?tous=1'}
            className="self-center text-sm font-semibold link"
          >
            {showAll ? 'Afficher les messages à traiter' : 'Afficher aussi les messages traités'}
          </Link>
        }
      />
      {messages.length === 0 ? (
        <EmptyState title={showAll ? 'Aucun message' : 'Aucun message à traiter'} />
      ) : (
        <ul className="flex flex-col gap-5">
          {messages.map((message) => (
            <li key={message.id} className="flex flex-col gap-4 rounded-md bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="label-caps text-ink-muted">
                    {message.subject} · {formatDateTime(message.createdAt)}
                  </p>
                  <p className="font-semibold">
                    {message.name} ·{' '}
                    <a
                      href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                      className="break-all link"
                    >
                      {message.email}
                    </a>
                  </p>
                </div>
                {message.handledAt ? (
                  <Badge tone="success">Traité</Badge>
                ) : (
                  <Badge tone="warning">À traiter</Badge>
                )}
              </div>
              <p className="max-w-prose whitespace-pre-line">{message.message}</p>
              {!message.handledAt ? (
                <ActionForm
                  action={markMessageHandledAction}
                  fields={{ messageId: message.id }}
                  label="Marquer comme traité"
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
