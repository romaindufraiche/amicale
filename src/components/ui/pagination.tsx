import Link from 'next/link'
import { buttonClasses } from './button'

type PaginationProps = {
  page: number
  pageCount: number
  /** Construit l'URL d'une page en conservant les filtres courants. */
  hrefFor: (page: number) => string
}

export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={buttonClasses('secondary', 'sm')} rel="prev">
          Page précédente
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-ink-muted tabular">
        Page {page} sur {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={buttonClasses('secondary', 'sm')} rel="next">
          Page suivante
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
