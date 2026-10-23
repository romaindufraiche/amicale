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
export function Officer({ x = 0, look = {} }: { x?: number; look?: Look }) {
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
export function Dog({ x = 0, y = 0 }: { x?: number; y?: number }) {
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

/* ─── Personnages des petites histoires ──────────────────────────────────── */

type CivilianLook = {
  head: 'beanie' | 'hood' | 'hair'
  headColor: string
  shirt: string
  pants: string
  stripes?: boolean
  mask?: boolean
  longCoat?: boolean
  armsUp?: boolean
  bag?: 'hand' | 'money'
  skin?: string
}

/** Passant, brigand ou voleur, 9 × 18 (même gabarit que les policiers). */
function Civilian({ x = 0, look }: { x?: number; look: CivilianLook }) {
  const skin = look.skin ?? SKIN
  const torsoHeight = look.longCoat ? 7 : 5
  return (
    <g transform={`translate(${x} 0)`}>
      {look.head === 'hood' ? <rect x="1" y="1" width="7" height="6" fill={look.headColor} /> : null}
      {look.head === 'hair' ? (
        <>
          <rect x="2" y="1" width="5" height="2" fill={look.headColor} />
          <rect x="1" y="2" width="2" height="5" fill={look.headColor} />
        </>
      ) : null}
      {look.head === 'beanie' ? <rect x="2" y="0" width="5" height="3" fill={look.headColor} /> : null}
      <rect
        x={look.head === 'hood' ? 3 : 2}
        y="3"
        width={look.head === 'hood' ? 4 : 5}
        height="3"
        fill={skin}
      />
      {look.mask ? (
        <>
          <rect x="2" y="4" width="5" height="1" fill={BOOT} />
          <rect x="5" y="4" width="1" height="1" fill={WHITE} />
        </>
      ) : (
        <rect x="5" y="4" width="1" height="1" fill={BOOT} />
      )}
      <rect x="1" y="6" width="7" height={torsoHeight} fill={look.shirt} />
      {look.stripes ? (
        <>
          <rect x="1" y="7" width="7" height="1" fill={WHITE} />
          <rect x="1" y="9" width="7" height="1" fill={WHITE} />
        </>
      ) : null}
      {look.armsUp ? (
        <>
          <rect x="0" y="1" width="1" height="6" fill={look.shirt} />
          <rect x="8" y="1" width="1" height="6" fill={look.shirt} />
          <rect x="0" y="0" width="1" height="1" fill={skin} />
          <rect x="8" y="0" width="1" height="1" fill={skin} />
        </>
      ) : (
        <>
          <rect x="4" y="7" width="2" height="4" fill={look.stripes ? BOOT : look.shirt} />
          <rect x="4" y="11" width="2" height="1" fill={skin} />
        </>
      )}
      {look.bag === 'hand' ? <rect x="5" y="11" width="3" height="3" fill="#7c2d12" /> : null}
      {look.bag === 'money' ? (
        <>
          <rect x="5" y="10" width="4" height="4" fill="#c9a227" />
          <rect x="6" y="9" width="2" height="1" fill="#a16207" />
          <rect x="6" y="11" width="2" height="1" fill="#713f12" />
        </>
      ) : null}
      <g className="town-step-a">
        <rect x="1" y={6 + torsoHeight} width="2" height={11 - torsoHeight} fill={look.pants} />
        <rect x="6" y={6 + torsoHeight} width="2" height={11 - torsoHeight} fill={look.pants} />
        <rect x="0" y="17" width="3" height="1" fill={BOOT} />
        <rect x="6" y="17" width="3" height="1" fill={BOOT} />
      </g>
      <g className="town-step-b">
        <rect x="3" y={6 + torsoHeight} width="3" height={11 - torsoHeight} fill={look.pants} />
        <rect x="3" y="17" width="4" height="1" fill={BOOT} />
      </g>
    </g>
  )
}

const ROBBER: CivilianLook = {
  head: 'beanie',
  headColor: BOOT,
  shirt: '#1f2937',
  pants: '#374151',
  stripes: true,
  mask: true,
}
const ROBBER_2: CivilianLook = { ...ROBBER, skin: SKIN_DARK }
const LADY: CivilianLook = {
  head: 'hair',
  headColor: '#7c4a1e',
  shirt: '#be123c',
  pants: '#1e293b',
  longCoat: true,
  bag: 'hand',
}
const THIEF: CivilianLook = { head: 'hood', headColor: '#6b7280', shirt: '#6b7280', pants: '#1e3a5f' }

/** Deux brigands masqués, 20 × 18 ; avec leurs sacs de billets ou les mains en l'air. */
export function Robbers({ pose = 'walk' }: { pose?: 'walk' | 'loot' | 'handsUp' }) {
  const extra = pose === 'loot' ? { bag: 'money' as const } : pose === 'handsUp' ? { armsUp: true } : {}
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" shapeRendering="crispEdges">
      <Civilian x={0} look={{ ...ROBBER, ...extra }} />
      <Civilian x={11} look={{ ...ROBBER_2, ...extra }} />
    </svg>
  )
}

/** Deux policiers qui ramènent les brigands menottés au commissariat, 42 × 18. */
export function Escort() {
  return (
    <svg width="42" height="18" viewBox="0 0 42 18" shapeRendering="crispEdges">
      <Officer x={0} />
      <Civilian x={10} look={ROBBER} />
      <Civilian x={21} look={ROBBER_2} />
      <rect x="8" y="11" width="3" height="1" fill="#9ca3af" />
      <rect x="29" y="11" width="4" height="1" fill="#9ca3af" />
      <Officer x={32} look={{ ponytail: true, hair: '#6b4423' }} />
    </svg>
  )
}

/** Passante avec son sac à main (ou sans, après le vol), 9 × 18. */
export function Lady({ withBag = true }: { withBag?: boolean }) {
  return (
    <svg width="9" height="18" viewBox="0 0 9 18" shapeRendering="crispEdges">
      <Civilian look={withBag ? LADY : { ...LADY, bag: undefined }} />
    </svg>
  )
}

/** Voleur à capuche, avec ou sans le sac volé, 9 × 18. */
export function Thief({ withBag = false, handsUp = false }: { withBag?: boolean; handsUp?: boolean }) {
  return (
    <svg width="9" height="18" viewBox="0 0 9 18" shapeRendering="crispEdges">
      <Civilian look={{ ...THIEF, ...(withBag ? { bag: 'hand' as const } : {}), armsUp: handsUp }} />
    </svg>
  )
}

/** Policier seul, 9 × 18. */
export function OfficerAlone() {
  return (
    <svg width="9" height="18" viewBox="0 0 9 18" shapeRendering="crispEdges">
      <Officer />
    </svg>
  )
}

/** Chien seul, échappé, 12 × 9. */
export function DogAlone() {
  return (
    <svg width="12" height="9" viewBox="0 -1 12 9" shapeRendering="crispEdges">
      <Dog />
    </svg>
  )
}

/** Voiture de sport rouge, 32 × 12. */
export function SportsCar() {
  return (
    <svg width="32" height="12" viewBox="0 0 32 12" shapeRendering="crispEdges">
      <rect x="10" y="1" width="12" height="3" fill="#b91c1c" />
      <rect x="12" y="2" width="8" height="2" fill="#9cc3e8" />
      <rect x="1" y="4" width="30" height="4" fill="#dc2626" />
      <rect x="1" y="6" width="30" height="1" fill="#7f1d1d" />
      <rect x="30" y="4" width="1" height="1" fill="#fde68a" />
      <rect x="0" y="3" width="3" height="1" fill={BOOT} />
      <circle cx="7" cy="9.5" r="2.5" fill={BOOT} />
      <circle cx="25" cy="9.5" r="2.5" fill={BOOT} />
      <circle cx="7" cy="9.5" r="1" fill="#9ca3af" />
      <circle cx="25" cy="9.5" r="1" fill="#9ca3af" />
    </svg>
  )
}

/** Banque : fronton, colonnes, enseigne et gyrophare d'alarme (éteint), 54 × 40. */
export function Bank() {
  const STONE = '#efe6d2'
  return (
    <svg width="54" height="40" viewBox="0 0 54 40" shapeRendering="crispEdges">
      <rect x="25" y="0" width="4" height="3" fill="#7f1d1d" />
      <rect x="23" y="3" width="8" height="2" fill={STONE} />
      <rect x="15" y="5" width="24" height="2" fill={STONE} />
      <rect x="6" y="7" width="42" height="2" fill={STONE} />
      <rect x="2" y="9" width="50" height="2" fill="#d6c7a1" />
      <rect x="6" y="11" width="42" height="6" fill="#1f2937" />
      <text
        x="27"
        y="15.8"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill={GOLD}
        letterSpacing="0.4"
        shapeRendering="geometricPrecision"
      >
        BANQUE
      </text>
      <rect x="4" y="17" width="46" height="21" fill={STONE} />
      {[7, 15, 35, 43].map((x) => (
        <rect key={x} x={x} y="18" width="3" height="19" fill={WHITE} />
      ))}
      <rect x="22" y="25" width="10" height="13" fill="#78350f" />
      <rect x="26" y="25" width="2" height="13" fill="#451a03" />
      <rect x="2" y="38" width="50" height="2" fill="#cbd5e1" />
    </svg>
  )
}
