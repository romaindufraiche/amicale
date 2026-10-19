/* eslint-disable @next/next/no-img-element -- images déjà redimensionnées et converties en WebP au téléversement */
import { cn } from '@/lib/cn'
import { mediaUrl } from '../constants'

/**
 * Image téléversée affichée dans un cadre de format fixe, sans jamais être rognée :
 * l'image entière est posée devant une copie floutée d'elle-même qui remplit le cadre.
 * Logos, affiches et photos de tous formats restent ainsi lisibles et soignés.
 * Toujours décorative : le sens est porté par le texte qui l'accompagne.
 * `className` règle le cadre (format, arrondi, largeur).
 */
export function FramedImage({
  mediaId,
  className,
  eager = false,
}: {
  mediaId: string
  className?: string
  eager?: boolean
}) {
  const src = mediaUrl(mediaId)
  const loading = eager ? 'eager' : 'lazy'
  return (
    <div className={cn('relative overflow-hidden bg-sunken', className)}>
      <img
        src={src}
        alt=""
        aria-hidden
        loading={loading}
        decoding="async"
        className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl saturate-150"
      />
      <img
        src={src}
        alt=""
        loading={loading}
        decoding="async"
        className="absolute inset-0 size-full object-contain p-3"
      />
    </div>
  )
}
