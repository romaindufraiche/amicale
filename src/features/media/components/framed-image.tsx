/* eslint-disable @next/next/no-img-element -- images déjà redimensionnées et converties en WebP au téléversement */
import { cn } from '@/lib/cn'
import { mediaUrl } from '../constants'

/**
 * Image téléversée affichée dans un cadre de format fixe, sans jamais être rognée :
 * l'image entière, aux coins arrondis, est posée devant une copie floutée d'elle-même
 * qui remplit le cadre.
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
      {/* Léger assombrissement vers les bords : l'image ressort au centre. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(10_25_60/0.18))]" />
      {/* Image entière en « carte » arrondie et ombrée ; jamais agrandie au-delà de sa
          taille réelle, pour rester nette même quand le fichier est petit. */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src={src}
          alt=""
          loading={loading}
          decoding="async"
          className="max-h-full max-w-full rounded-md shadow-[0_8px_24px_-6px_rgb(10_25_60/0.35),0_0_0_1px_rgb(10_25_60/0.06)]"
        />
      </div>
    </div>
  )
}
