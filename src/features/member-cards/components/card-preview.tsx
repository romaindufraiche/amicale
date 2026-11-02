import { formatMemberNumber } from '../schemas'

/** Aperçu de la carte (modèle « Nuit »), à l'échelle de son conteneur. Décoratif. */
export function CardPreview({
  lastName,
  firstName,
  season,
  number,
}: {
  lastName: string
  firstName: string
  season: string
  number: number | null
}) {
  return (
    <div className="@container w-full max-w-[428px]">
      <div
        aria-hidden
        className="relative aspect-[85.6/54] overflow-hidden rounded-[3.74cqw] bg-blue-900 text-white shadow-overlay"
      >
        <span className="absolute right-[-3.5cqw] bottom-[-10.5cqw] font-display text-[49cqw] leading-none font-black tracking-tight text-white/6">
          95
        </span>
        <span className="absolute top-[5.84cqw] left-[5.84cqw] w-[29.2cqw] rounded-[1.87cqw] bg-white px-[2.34cqw] py-[1.64cqw]">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu décoratif */}
          <img src="/brand/logo-adpvo.png" alt="" className="block w-full" />
        </span>
        <span className="absolute top-[7cqw] right-[5.84cqw] flex flex-col items-end gap-[1.2cqw] text-right">
          <span className="text-[3.1cqw] leading-[1.35] font-semibold tracking-[0.14em] text-amber-300 uppercase">
            Carte
            <br />
            d’adhérent
          </span>
          <span className="font-display text-[3.5cqw] font-semibold">
            N° {number === null ? '····' : formatMemberNumber(number)}
          </span>
        </span>
        <span className="absolute bottom-[10.5cqw] left-[5.84cqw] flex flex-col">
          <span className="font-display text-[6.2cqw] leading-none font-black">
            {lastName.toLocaleUpperCase('fr-FR') || 'NOM'}
          </span>
          <span className="font-display text-[4.35cqw] leading-tight font-semibold text-blue-100">
            {firstName || 'Prénom'}
          </span>
        </span>
        <span className="absolute bottom-[8.4cqw] left-[5.84cqw] h-[0.93cqw] w-[21cqw] bg-[linear-gradient(90deg,#002395,#fff,#ed2939)]" />
        <span className="absolute right-[5.84cqw] bottom-[4.1cqw] left-[5.84cqw] flex justify-between text-[2.65cqw] font-semibold text-blue-100">
          <span>Saison {season}</span>
          <span>adpvo.fr</span>
        </span>
      </div>
    </div>
  )
}
