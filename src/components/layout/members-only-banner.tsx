import { BadgeCheck } from 'lucide-react'
import { site } from '@/config/site'

/** Bandeau en haut de chaque page publique : les offres sont réservées aux adhérents à jour. */
export function MembersOnlyBanner() {
  return (
    <p className="bg-amber-300 px-4 py-2 text-center text-sm font-bold text-ink sm:px-6 lg:px-8">
      <BadgeCheck aria-hidden className="mr-1.5 inline size-4 align-[-0.2em]" />
      {site.notices.membersOnly}
    </p>
  )
}
