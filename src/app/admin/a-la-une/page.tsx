import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { HIGHLIGHT_TONES } from '@/features/highlights/labels'
import { listHighlightsForAdmin } from '@/features/highlights/queries'
import { formatShortDate } from '@/lib/dates'
import { cn } from '@/lib/cn'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'À la une' }

type Props = { searchParams: Promise<{ supprime?: string }> }

export default async function AdminHighlightsPage({ searchParams }: Props) {
  await requirePermission('news:manage', '/admin/a-la-une')
  const items = await listHighlightsForAdmin()
  const deleted = (await searchParams).supprime === '1'
  const now = new Date()

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="À la une"
        lead="Posts courts qui défilent sur la page d’accueil du site."
        actions={
          <ButtonLink href="/admin/a-la-une/nouveau">
            <Plus aria-hidden className="size-4" /> Nouveau post
          </ButtonLink>
        }
      />
      {deleted ? <Alert tone="success" title="Post supprimé." /> : null}
      {items.length === 0 ? (
        <EmptyState
          title="Aucun post"
          action={<ButtonLink href="/admin/a-la-une/nouveau">Créer le premier post</ButtonLink>}
        >
          Annoncez une sortie, une permanence, une nouveauté de la billetterie…
        </EmptyState>
      ) : (
        <Table caption="Posts à la une">
          <thead>
            <tr>
              <Th>Post</Th>
              <Th>Période</Th>
              <Th className="text-right">Ordre</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const expired = item.endsAt !== null && item.endsAt <= now
              const scheduled = item.startsAt !== null && item.startsAt > now
              return (
                <tr key={item.id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={cn('size-4 shrink-0 rounded-sm', HIGHLIGHT_TONES[item.tone].classes)}
                      />
                      <Link href={`/admin/a-la-une/${item.id}`} className="font-semibold link">
                        {item.title}
                      </Link>
                    </span>
                  </Td>
                  <Td className="tabular">
                    {item.startsAt || item.endsAt
                      ? `${item.startsAt ? `du ${formatShortDate(item.startsAt)}` : ''} ${item.endsAt ? `au ${formatShortDate(item.endsAt)}` : ''}`.trim()
                      : 'Permanente'}
                  </Td>
                  <Td className="text-right tabular">{item.position}</Td>
                  <Td>
                    {!item.published ? (
                      <Badge tone="warning">Brouillon</Badge>
                    ) : expired ? (
                      <Badge tone="neutral">Terminé</Badge>
                    ) : scheduled ? (
                      <Badge tone="info">Programmé</Badge>
                    ) : (
                      <Badge tone="success">En ligne</Badge>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </>
  )
}
