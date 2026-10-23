/*
 * Petits personnages du site, dessinés au pixel (1 unité = 1 pixel à l'écran).
 * Tous regardent vers la droite ; le moteur les retourne pour aller à gauche.
 * Les jambes alternent entre deux positions (`town-step-a` / `town-step-b`).
 */

const NAVY = '#1f2f55'
const NAVY_DARK = '#141f3b'
const SKIN = '#f0c39e'
const SKIN_DARK = '#c98f68'
const BOOT = '#111827'
const WHITE = '#ffffff'
const FLAG_BLUE = '#002395'
const FLAG_RED = '#ed2939'
const GOLD = '#d9a520'

type Look = { hair?: string; ponytail?: boolean; kepi?: boolean; coat?: boolean; skin?: string }

/** Policier ou policière en tenue, debout, 9 × 18. */
function Officer({ x = 0, look = {} }: { x?: number; look?: Look }) {
  const skin = look.skin ?? SKIN
  return (
    <g transform={`translate(${x} 0)`}>
      {/* Couvre-chef : casquette, ou képi à bandeau doré pour le commissaire. */}
      {look.kepi ? (
        <>
          <rect x="2" y="0" width="5" height="3" fill={NAVY_DARK} />
          <rect x="2" y="2" width="5" height="1" fill={GOLD} />
          <rect x="6" y="3" width="2" height="1" fill={BOOT} />
        </>
      ) : (
        <>
          <rect x="2" y="1" width="5" height="2" fill={NAVY_DARK} />
          <rect x="6" y="2" width="2" height="1" fill={BOOT} />
        </>
      )}
      {look.ponytail ? <rect x="1" y="3" width="2" height="3" fill={look.hair ?? '#5b3a1e'} /> : null}
      <rect x="2" y="3" width="5" height="3" fill={skin} />
      <rect x="5" y="4" width="1" height="1" fill={BOOT} />
      {/* Veste, bande « POLICE » et ceinturon. */}
      <rect x="1" y="6" width="7" height={look.coat ? 8 : 5} fill={NAVY} />
      {look.coat ? (
        <>
          <rect x="5" y="8" width="1" height="1" fill={GOLD} />
          <rect x="5" y="10" width="1" height="1" fill={GOLD} />
        </>
      ) : (
        <>
          <rect x="2" y="8" width="5" height="1" fill={WHITE} />
          <rect x="1" y="10" width="7" height="1" fill={BOOT} />
        </>
      )}
      <rect x="1" y="6" width="1" height="1" fill={FLAG_BLUE} />
      {/* Bras et main. */}
      <rect x="4" y="7" width="2" height="4" fill={NAVY_DARK} />
      <rect x="4" y="11" width="2" height="1" fill={skin} />
      {/* Jambes : deux positions. */}
      <g className="town-step-a">
        <rect x="1" y="11" width="2" height="6" fill={NAVY_DARK} />
        <rect x="6" y="11" width="2" height="6" fill={NAVY_DARK} />
        <rect x="0" y="17" width="3" height="1" fill={BOOT} />
        <rect x="6" y="17" width="3" height="1" fill={BOOT} />
      </g>
      <g className="town-step-b">
        <rect x="3" y="11" width="3" height="6" fill={NAVY_DARK} />
        <rect x="3" y="17" width="4" height="1" fill={BOOT} />
      </g>
    </g>
  )
}

/** Chien de patrouille (berger malinois), 12 × 8. */
function Dog({ x = 0, y = 0 }: { x?: number; y?: number }) {
  const FUR = '#c58d4b'
  const MASK = '#3a2614'
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="1" width="2" height="1" fill={FUR} />
      <rect x="2" y="2" width="7" height="3" fill={FUR} />
      <rect x="8" y="0" width="3" height="3" fill={FUR} />
      <rect x="8" y="-1" width="1" height="1" fill={MASK} />
      <rect x="11" y="1" width="1" height="2" fill={MASK} />
      <rect x="7" y="2" width="1" height="1" fill={FLAG_RED} />
      <g className="town-step-a">
        <rect x="2" y="5" width="1" height="3" fill={MASK} />
        <rect x="8" y="5" width="1" height="3" fill={MASK} />
      </g>
      <g className="town-step-b">
        <rect x="3" y="5" width="1" height="3" fill={MASK} />
        <rect x="7" y="5" width="1" height="3" fill={MASK} />
      </g>
    </g>
  )
}

/** Policier et son chien en laisse, 24 × 18. */
export function OfficerWithDog() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" shapeRendering="crispEdges">
      <Officer />
      <path d="M6 11 Q 9 14 13 12" stroke={BOOT} strokeWidth="0.6" fill="none" />
      <Dog x={12} y={10} />
    </svg>
  )
}

/** Deux collègues qui marchent côte à côte, 20 × 18. */
export function TwoColleagues() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" shapeRendering="crispEdges">
      <Officer x={0} look={{ ponytail: true, hair: '#6b4423' }} />
      <Officer x={10} look={{ skin: SKIN_DARK }} />
    </svg>
  )
}

/** Commissaire en képi et manteau, 9 × 18. */
export function Commissioner() {
  return (
    <svg width="9" height="18" viewBox="0 0 9 18" shapeRendering="crispEdges">
      <Officer look={{ kepi: true, coat: true }} />
    </svg>
  )
}

/** Gyrophare : deux feux bleus qui clignotent en alternance. */
function Beacon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="6" height="1" fill="#475569" />
      <rect className="town-blink-a" x="0" y="-1" width="3" height="1" fill="#3b82f6" />
      <rect className="town-blink-b" x="3" y="-1" width="3" height="1" fill="#3b82f6" />
    </g>
  )
}

/** Voiture de police sérigraphiée, gyrophare allumé, 34 × 14. */
export function PoliceCar() {
  return (
    <svg width="34" height="14" viewBox="0 -1 34 15" shapeRendering="crispEdges" className="town-beacon-glow">
      <Beacon x={13} y={1} />
      <rect x="9" y="2" width="15" height="4" fill={WHITE} />
      <rect x="10" y="3" width="6" height="3" fill="#9cc3e8" />
      <rect x="17" y="3" width="6" height="3" fill="#9cc3e8" />
      <rect x="1" y="6" width="32" height="5" fill={WHITE} />
      <rect x="1" y="8" width="32" height="1" fill={FLAG_BLUE} />
      <rect x="1" y="9" width="32" height="1" fill={FLAG_RED} />
      <rect x="32" y="6" width="1" height="1" fill="#fde68a" />
      <rect x="1" y="6" width="1" height="1" fill={FLAG_RED} />
      <circle cx="8" cy="11.5" r="2.5" fill={BOOT} />
      <circle cx="26" cy="11.5" r="2.5" fill={BOOT} />
      <circle cx="8" cy="11.5" r="1" fill="#9ca3af" />
      <circle cx="26" cy="11.5" r="1" fill="#9ca3af" />
    </svg>
  )
}

/** Motard de la police, gyrophare allumé, 20 × 16. */
export function PoliceBiker() {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" shapeRendering="crispEdges" className="town-beacon-glow">
      {/* Pilote : casque blanc, blouson. */}
      <rect x="7" y="0" width="4" height="3" fill={WHITE} />
      <rect x="10" y="1" width="1" height="1" fill="#334155" />
      <rect x="7" y="3" width="4" height="5" fill={NAVY} />
      <rect x="10" y="5" width="3" height="1" fill={NAVY_DARK} />
      <rect x="6" y="8" width="5" height="2" fill={NAVY_DARK} />
      {/* Moto. */}
      <rect x="4" y="9" width="11" height="3" fill={WHITE} />
      <rect x="4" y="10" width="11" height="1" fill={FLAG_BLUE} />
      <rect x="13" y="6" width="1" height="4" fill="#475569" />
      <rect className="town-blink-a" x="15" y="8" width="2" height="1" fill="#3b82f6" />
      <rect className="town-blink-b" x="2" y="8" width="2" height="1" fill="#3b82f6" />
      <circle cx="4" cy="13" r="3" fill={BOOT} />
      <circle cx="16" cy="13" r="3" fill={BOOT} />
      <circle cx="4" cy="13" r="1" fill="#9ca3af" />
      <circle cx="16" cy="13" r="1" fill="#9ca3af" />
    </svg>
  )
}

/** Commissariat : façade, enseigne « POLICE », lanterne bleue et drapeau, 46 × 40. */
export function PoliceStation() {
  return (
    <svg width="46" height="40" viewBox="0 0 46 40" shapeRendering="crispEdges">
      {/* Drapeau tricolore sur le toit. */}
      <rect x="33" y="0" width="1" height="9" fill="#64748b" />
      <rect x="34" y="0" width="6" height="5" fill="#94a3b8" />
      <rect x="34" y="1" width="2" height="3" fill={FLAG_BLUE} />
      <rect x="36" y="1" width="2" height="3" fill={WHITE} />
      <rect x="38" y="1" width="2" height="3" fill={FLAG_RED} />
      {/* Bâtiment. */}
      <rect x="2" y="9" width="42" height="31" fill="#eef2f7" />
      <rect x="1" y="8" width="44" height="2" fill={NAVY} />
      <rect x="2" y="38" width="42" height="2" fill="#cbd5e1" />
      {/* Enseigne. */}
      <rect x="9" y="12" width="28" height="7" fill={FLAG_BLUE} />
      <text
        x="23"
        y="17.6"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill={WHITE}
        letterSpacing="0.4"
        shapeRendering="geometricPrecision"
      >
        POLICE
      </text>
      {/* Fenêtres. */}
      <rect x="5" y="23" width="7" height="6" fill="#9cc3e8" />
      <rect x="34" y="23" width="7" height="6" fill="#9cc3e8" />
      <rect x="8" y="23" width="1" height="6" fill={WHITE} />
      <rect x="37" y="23" width="1" height="6" fill={WHITE} />
      {/* Lanterne bleue et porte. */}
      <rect x="21" y="21" width="4" height="3" className="town-lantern" fill="#3b82f6" />
      <rect x="18" y="26" width="10" height="12" fill={NAVY} />
      <rect x="22" y="26" width="1" height="12" fill={NAVY_DARK} />
      <rect x="20" y="32" width="1" height="1" fill={GOLD} />
    </svg>
  )
}
