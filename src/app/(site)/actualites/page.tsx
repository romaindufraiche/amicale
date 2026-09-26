import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { NewsList } from '@/features/news/components/news-list'
import { listPublishedNews } from '@/features/news/queries'
import { pageCount, parsePage } from '@/lib/pagination'
import { getCurrentSession } from '@/server/auth/session'

export const metadata: Metadata = {
  title: 'Actualités',
  description: 'Les actualités de l’Amicale des Policiers du Val d’Oise.',
  alternates: { canonical: '/actualites' },
}

type Props = { searchParams: Promise<{ page?: string }> }

export default async function NewsIndexPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).page)
  const session = await getCurrentSession()
  const { rows, total } = await listPublishedNews({
    includeMembersOnly: session?.user.status === 'ACTIVE',
    page,
  })

  return (
    <div className="mx-auto flex max-w-page flex-col gap-12 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader eyebrow="La vie de l’Amicale" title="Actualités" />
      {rows.length > 0 ? (
        <>
          <NewsList items={rows} />
          <Pagination
            page={page}
            pageCount={pageCount(total)}
            hrefFor={(target) => `/actualites?page=${target}`}
          />
        </>
      ) : (
        <EmptyState
          title="Aucune actualité pour le moment"
          action={
            <ButtonLink href="/" variant="secondary">
              Retour à l’accueil
            </ButtonLink>
          }
        >
          Les annonces du bureau seront publiées ici.
        </EmptyState>
      )}
    </div>
  )
}
