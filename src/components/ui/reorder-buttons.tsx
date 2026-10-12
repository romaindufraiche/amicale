import { ArrowDown, ArrowUp } from 'lucide-react'

type ReorderButtonsProps = {
  /** Action serveur recevant `id` et `direction` (« up » ou « down »). */
  action: (formData: FormData) => Promise<void>
  id: string
  /** Nom de l'élément, pour les libellés lus par les lecteurs d'écran. */
  label: string
  isFirst: boolean
  isLast: boolean
}

const buttonClass =
  'grid size-9 place-items-center rounded-sm border border-line-strong bg-surface hover:border-ink disabled:opacity-30'

/** Boutons « Monter » / « Descendre » d'une liste ordonnée par le bureau. */
export function ReorderButtons({ action, id, label, isFirst, isLast }: ReorderButtonsProps) {
  return (
    <div className="flex gap-1">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="up" />
        <button type="submit" disabled={isFirst} className={buttonClass} aria-label={`Monter « ${label} »`}>
          <ArrowUp aria-hidden className="size-4" />
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="down" />
        <button type="submit" disabled={isLast} className={buttonClass} aria-label={`Descendre « ${label} »`}>
          <ArrowDown aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  )
}
