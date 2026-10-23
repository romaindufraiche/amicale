'use client'

import { setTownEnabled, useTownEnabled } from './town-store'

/** Lien du pied de page pour masquer ou réafficher les petits personnages animés (WCAG 2.2.2). */
export function TownToggle({ className }: { className?: string }) {
  const enabled = useTownEnabled()
  return (
    <button type="button" onClick={() => setTownEnabled(!enabled)} className={className}>
      {enabled ? 'Masquer les petits personnages' : 'Afficher les petits personnages'}
    </button>
  )
}
