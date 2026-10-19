import {
  Clapperboard,
  FerrisWheel,
  Flower2,
  type LucideIcon,
  Plane,
  Shapes,
  ShoppingBasket,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import type { OfferCategory } from '@/server/db/schema'
import { FramedImage } from '@/features/media/components/framed-image'

export const CATEGORY_ICONS: Record<OfferCategory, LucideIcon> = {
  PARCS: FerrisWheel,
  CINEMA: Clapperboard,
  VOYAGES: Plane,
  SPORT: Trophy,
  EPICERIE: ShoppingBasket,
  PARFUMERIE: Flower2,
  AUTRE: Shapes,
}

/** Ambiance de chaque catégorie, tirée exclusivement de la palette de marque. */
export const CATEGORY_TONES: Record<OfferCategory, string> = {
  PARCS: 'bg-amber-300 text-ink',
  CINEMA: 'bg-night-900 text-amber-300',
  VOYAGES: 'bg-blue-50 text-blue-700',
  SPORT: 'bg-blue-700 text-white',
  EPICERIE: 'bg-rose-600 text-white',
  PARFUMERIE: 'bg-rose-50 text-rose-700',
  AUTRE: 'bg-sunken text-ink',
}

/**
 * Visuel d'une offre : la photo fournie par le bureau si elle existe, sinon un visuel
 * de catégorie (couleur + pictogramme). Toujours décoratif : le titre
 * de l'offre est porté par le texte de la carte.
 */
export function OfferVisual({
  category,
  imageId,
  className,
}: {
  category: OfferCategory
  imageId: string | null
  className?: string
}) {
  if (imageId) {
    return <FramedImage mediaId={imageId} className={className} />
  }

  const Icon = CATEGORY_ICONS[category]
  return (
    <div aria-hidden className={cn('relative flex overflow-hidden', CATEGORY_TONES[category], className)}>
      {/* Grand pictogramme débordant, rogné par le cadre. */}
      <Icon strokeWidth={1.25} className="absolute -right-6 -bottom-8 size-44 opacity-30" />
    </div>
  )
}
