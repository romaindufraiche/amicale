'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Commissioner, OfficerWithDog, PoliceBiker, PoliceCar, PoliceStation, TwoColleagues } from './sprites'
import { useTownEnabled } from './town-store'

/** Position du commissariat (bord gauche) et de sa porte, en pixels. */
const STATION_LEFT = 8
const DOOR_X = STATION_LEFT + 18

/**
 * Trajets :
 * - `cross` : traverse tout l'écran, dans un sens au hasard ;
 * - `station` : sort du commissariat vers la droite, puis la fois suivante revient y entrer ;
 * - `stroll` : sort, fait quelques pas, s'arrête puis rentre.
 */
type Route = 'cross' | 'station' | 'stroll'

type Actor = {
  id: string
  sprite: ReactNode
  width: number
  route: Route
  /** Vitesse en pixels par seconde. */
  speed: number
  firstDelay: number
  /** Pause entre deux passages, en secondes [min, max]. */
  gap: [number, number]
  /** Premier passage vers le commissariat plutôt qu'en sortant. */
  startInbound?: boolean
}

const ACTORS: Actor[] = [
  { id: 'car', sprite: <PoliceCar />, width: 34, route: 'cross', speed: 170, firstDelay: 3, gap: [14, 30] },
  {
    id: 'dog',
    sprite: <OfficerWithDog />,
    width: 24,
    route: 'station',
    speed: 26,
    firstDelay: 1,
    gap: [6, 16],
  },
  {
    id: 'pair',
    sprite: <TwoColleagues />,
    width: 20,
    route: 'station',
    speed: 22,
    firstDelay: 12,
    gap: [10, 24],
    startInbound: true,
  },
  {
    id: 'bike',
    sprite: <PoliceBiker />,
    width: 20,
    route: 'cross',
    speed: 230,
    firstDelay: 20,
    gap: [25, 50],
  },
  {
    id: 'chief',
    sprite: <Commissioner />,
    width: 9,
    route: 'stroll',
    speed: 18,
    firstDelay: 30,
    gap: [30, 60],
  },
]

const random = (min: number, max: number) => min + Math.random() * (max - min)

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer)
      resolve()
    })
  })
}

type Plan = { keyframes: Keyframe[]; flip: Keyframe[]; duration: number }

/** Calcule un passage ; `run` compte les passages déjà faits (aller-retour du commissariat). */
function plan(actor: Actor, run: number, viewport: number): Plan {
  const offRight = viewport + 20
  const offLeft = -actor.width - 20
  const door = DOOR_X - actor.width / 2
  const ms = (distance: number) => (Math.abs(distance) / actor.speed) * 1000
  const right: Keyframe[] = [{ transform: 'scaleX(1)' }, { transform: 'scaleX(1)' }]
  const left: Keyframe[] = [{ transform: 'scaleX(-1)' }, { transform: 'scaleX(-1)' }]
  const at = (x: number, opacity = 1, offset?: number): Keyframe => ({
    transform: `translateX(${x}px)`,
    opacity,
    ...(offset === undefined ? {} : { offset }),
  })

  if (actor.route === 'cross') {
    const toRight = Math.random() < 0.5
    const [from, to] = toRight ? [offLeft, offRight] : [offRight, offLeft]
    return { keyframes: [at(from), at(to)], flip: toRight ? right : left, duration: ms(to - from) }
  }

  if (actor.route === 'station') {
    const inbound = (run % 2 === 1) !== Boolean(actor.startInbound)
    const duration = ms(offRight - door)
    return inbound
      ? { keyframes: [at(offRight), at(door, 1, 0.97), at(door, 0)], flip: left, duration }
      : { keyframes: [at(door, 0), at(door, 1, 0.03), at(offRight)], flip: right, duration }
  }

  // Petite promenade devant le commissariat, pause, puis retour.
  const stop = door + Math.min(random(90, 220), viewport * 0.4)
  const walk = ms(stop - door)
  const pause = 3000
  const duration = walk * 2 + pause
  const a = walk / duration
  const b = (walk + pause) / duration
  return {
    keyframes: [
      at(door, 0),
      at(door, 1, 0.02),
      at(stop, 1, a),
      at(stop, 1, b),
      at(door, 1, 0.98),
      at(door, 0),
    ],
    flip: [
      { transform: 'scaleX(1)' },
      { transform: 'scaleX(1)', offset: b },
      { transform: 'scaleX(-1)', offset: Math.min(b + 0.001, 1) },
      { transform: 'scaleX(-1)' },
    ],
    duration,
  }
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

/**
 * Petite ville en bas de l'écran : un commissariat et des policiers, une voiture et une moto
 * qui passent. Purement décoratif (masqué aux lecteurs d'écran, ne capte pas les clics),
 * immobile si le visiteur a demandé à réduire les animations, et désactivable depuis le pied
 * de page.
 */
export function PoliceTown() {
  const enabled = useTownEnabled()
  const reduced = useReducedMotion()
  const actorRefs = useRef(new Map<string, HTMLDivElement>())
  const flipRefs = useRef(new Map<string, HTMLDivElement>())

  useEffect(() => {
    if (!enabled || reduced) return
    const controller = new AbortController()
    const { signal } = controller
    const running: Animation[] = []

    for (const actor of ACTORS) {
      void (async () => {
        await sleep(actor.firstDelay * 1000, signal)
        for (let run = 0; !signal.aborted; run += 1) {
          const element = actorRefs.current.get(actor.id)
          const flip = flipRefs.current.get(actor.id)
          if (!element || !flip) return
          const next = plan(actor, run, window.innerWidth)
          const move = element.animate(next.keyframes, {
            duration: next.duration,
            easing: 'linear',
            fill: 'both',
          })
          const turn = flip.animate(next.flip, { duration: next.duration, fill: 'both' })
          running.push(move, turn)
          try {
            await move.finished
          } catch {
            return // animation annulée
          }
          running.splice(running.indexOf(move), 1)
          running.splice(running.indexOf(turn), 1)
          await sleep(random(...actor.gap) * 1000, signal)
        }
      })()
    }

    return () => {
      controller.abort()
      for (const animation of running) animation.cancel()
    }
  }, [enabled, reduced])

  if (!enabled) return null

  return (
    <div
      aria-hidden
      className="town pointer-events-none fixed inset-x-0 bottom-0 z-30 h-12 select-none print:hidden"
    >
      <div className="absolute bottom-0 hidden sm:block" style={{ left: STATION_LEFT }}>
        <PoliceStation />
      </div>
      {ACTORS.map((actor) => (
        <div
          key={actor.id}
          ref={(node) => {
            if (node) actorRefs.current.set(actor.id, node)
            else actorRefs.current.delete(actor.id)
          }}
          className="absolute bottom-0.5 left-0 opacity-0 will-change-transform"
        >
          <div
            ref={(node) => {
              if (node) flipRefs.current.set(actor.id, node)
              else flipRefs.current.delete(actor.id)
            }}
          >
            {actor.sprite}
          </div>
        </div>
      ))}
    </div>
  )
}
