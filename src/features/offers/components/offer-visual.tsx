import {
  Clapperboard,
  FerrisWheel,
  type LucideIcon,
  Plane,
  Sparkles,
  Theater,
  Trophy,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import { mediaUrl } from '@/features/media/constants'
import { cn } from '@/lib/cn'
import type { OfferCategory } from '@/server/db/schema'

export const CATEGORY_ICONS: Record<OfferCategory, LucideIcon> = {
  CINEMA: Clapperboard,
  PARCS: FerrisWheel,
  SPECTACLES: Theater,
  SPORT: Trophy,
  VOYAGES: Plane,
  FAMILLE: Users,
  AUTRE: Sparkles,
}

/** Ambiance de chaque catégorie, tirée exclusivement de la palette de marque. */
const CATEGORY_TONES: Record<OfferCategory, string> = {
  CINEMA: 'bg-night-900 text-amber-300',
  PARCS: 'bg-amber-300 text-ink',
  SPECTACLES: 'bg-rose-600 text-white',
  SPORT: 'bg-blue-700 text-white',
  VOYAGES: 'bg-blue-50 text-blue-700',
  FAMILLE: 'bg-rose-50 text-rose-700',
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
  sizes,
  className,
}: {
  category: OfferCategory
  imageId: string | null
  sizes: string
  className?: string
}) {
  if (imageId) {
    return (
      <div className={cn('relative overflow-hidden bg-sunken', className)}>
        {/* Image déjà redimensionnée et convertie en WebP au téléversement. */}
        <Image src={mediaUrl(imageId)} alt="" fill sizes={sizes} unoptimized className="object-cover" />
      </div>
    )
  }

  const Icon = CATEGORY_ICONS[category]
  return (
    <div aria-hidden className={cn('relative flex overflow-hidden', CATEGORY_TONES[category], className)}>
      {/* Grand pictogramme débordant, rogné par le cadre. */}
      <Icon strokeWidth={1.25} className="absolute -right-6 -bottom-8 size-44 opacity-30" />
    </div>
  )
}
