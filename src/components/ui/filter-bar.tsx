import { Search } from 'lucide-react'
import Link from 'next/link'
import { buttonClasses } from './button'

type FilterBarProps = {
  action: string
  search?: { name: string; label: string; value?: string }
  select?: {
    name: string
    label: string
    value?: string
    options: readonly { value: string; label: string }[]
  }
  hasFilters: boolean
}

/** Filtres de liste en GET : l'état est dans l'URL (partageable, bouton retour fonctionnel). */
export function FilterBar({ action, search, select, hasFilters }: FilterBarProps) {
  return (
    <form action={action} method="get" role="search" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {search ? (
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor={`filter-${search.name}`} className="text-sm font-semibold">
            {search.label}
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            />
            <input
              id={`filter-${search.name}`}
              name={search.name}
              type="search"
              defaultValue={search.value}
              maxLength={100}
              className="h-11 w-full rounded-sm border border-line-strong bg-surface pr-3 pl-9 hover:border-ink focus-visible:border-blue-500"
            />
          </div>
        </div>
      ) : null}
      {select ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`filter-${select.name}`} className="text-sm font-semibold">
            {select.label}
          </label>
          <select
            id={`filter-${select.name}`}
            name={select.name}
            defaultValue={select.value ?? ''}
            className="h-11 rounded-sm border border-line-strong bg-surface px-3 hover:border-ink focus-visible:border-blue-500"
          >
            <option value="">Tous</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" className={buttonClasses('primary', 'sm', 'min-h-11')}>
          Filtrer
        </button>
        {hasFilters ? (
          <Link href={action} className={buttonClasses('ghost', 'sm', 'min-h-11')}>
            Réinitialiser
          </Link>
        ) : null}
      </div>
    </form>
  )
}
