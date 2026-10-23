import type { Metadata } from 'next'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { ClassifiedCard } from '@/features/classifieds/components/classified-card'
import { CLASSIFIED_KIND_VALUES, CLASSIFIED_KINDS, parseClassifiedKind } from '@/features/classifieds/labels'
import { listPublishedClassifieds } from '@/features/classifieds/queries'
import { GlmShowcase } from '@/features/glm/glm-showcase'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  title: 'Annonces',
  description: 'Les petites annonces entre collègues : vente, location, prêt, don et troc.',
  alternates: { canonical: '/annonces' },
}

type Props = { searchParams: Promise<{ type?: string }> }

export default async function ClassifiedsPage({ searchParams }: Props) {
  const kind = parseClassifiedKind((await searchParams).type)
  const items = await listPublishedClassifieds(kind)
  const tabs = [null, ...CLASSIFIED_KIND_VALUES]

  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader
        eyebrow="Entre collègues"
        title="Annonces"
        lead="Vente, location, prêt de matériel, don ou troc : les annonces des collègues. Pour publier la vôtre, écrivez au bureau."
        actions={
          <ButtonLink href="/contact" variant="secondary">
            Proposer une annonce
          </ButtonLink>
        }
      />

      <nav aria-label="Types d’annonce" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-2">
          {tabs.map((value) => {
            const active = value === kind
            return (
              <li key={value ?? 'toutes'} className="shrink-0">
                <Link
                  href={value ? `/annonces?type=${CLASSIFIED_KINDS[value].slug}` : '/annonces'}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-sm border px-4 text-sm font-semibold transition-colors',
                    active
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-line-strong bg-surface text-ink hover:border-ink',
                  )}
                >
                  {value ? CLASSIFIED_KINDS[value].label : 'Toutes'}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Annonce épinglée du créateur du site, toujours en tête de l'onglet « Toutes ». */}
      {kind === null ? <GlmShowcase /> : null}

      {items.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <ClassifiedCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={kind ? 'Aucune annonce de ce type' : 'Aucune autre annonce pour le moment'}>
          {kind
            ? 'Aucune annonce de ce type. Consultez les autres onglets.'
            : 'Les annonces des collègues apparaîtront ici.'}
        </EmptyState>
      )}
    </div>
  )
}
