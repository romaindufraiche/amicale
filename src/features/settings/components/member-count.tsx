import { Users } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getSiteSettings } from '../queries'

/** Nombre d'adhérents saisi par le bureau, affiché sous les boutons « Adhérer ». Rien s'il n'est pas renseigné. */
export async function MemberCount({ className }: { className?: string }) {
  const { memberCount } = await getSiteSettings()
  if (memberCount === null || memberCount <= 0) return null
  return (
    <p className={cn('inline-flex items-center gap-2', className)}>
      <Users aria-hidden className="size-5" />
      <span>
        <strong className="font-display text-lead font-black tabular">
          {memberCount.toLocaleString('fr-FR')}
        </strong>{' '}
        adhérent{memberCount > 1 ? 's' : ''} à l’Amicale
      </span>
    </p>
  )
}
