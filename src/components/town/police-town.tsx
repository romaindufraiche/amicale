'use client'

import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import {
  Bank,
  Commissioner,
  Lady,
  OfficerAlone,
  OfficerWithDog,
  PoliceBiker,
  PoliceCar,
  PoliceStation,
  Robbers,
  Thief,
  TwoColleagues,
} from './sprites'
import { useTownEnabled } from './town-store'

/*
 * Petite ville vivante : des personnages minuscules se promènent sur la page.
 * - Ils marchent sur le haut des cartes, titres et encadrés (les « plateformes ») ; au bord,
 *   ils font demi-tour ou se laissent tomber sur la plateforme du dessous.
 * - La rue longe le haut du pied de page : commissariat à gauche, banque à droite, voiture et
 *   moto de police y patrouillent. Les brigands sortent de la banque avec le butin ; un
 *   policier qui les croise sur la même plateforme leur court après et les arrête.
 * - On peut attraper un personnage à la souris (ou au doigt) et le lâcher : il retombe.
 *   Un simple clic le fait trébucher et tomber.
 * Purement décoratif : masqué aux lecteurs d'écran, désactivable depuis le pied de page,
 * absent si le visiteur a demandé à réduire les animations.
 */

type Team = 'police' | 'civil' | 'robber'
type Pose = 'walk' | 'loot' | 'handsUp'
type KindName =
  'dogOfficer' | 'colleagues' | 'chief' | 'officer' | 'lady' | 'robbers' | 'thief' | 'car' | 'bike'

type Kind = {
  width: number
  height: number
  team: Team
  vehicle?: boolean
  /** Vitesses en pixels par seconde. */
  walk: number
  run: number
  sprite: (pose: Pose) => ReactNode
}

const KINDS: Record<KindName, Kind> = {
  dogOfficer: { width: 24, height: 18, team: 'police', walk: 26, run: 70, sprite: () => <OfficerWithDog /> },
  colleagues: { width: 20, height: 18, team: 'police', walk: 22, run: 64, sprite: () => <TwoColleagues /> },
  chief: { width: 9, height: 18, team: 'police', walk: 17, run: 50, sprite: () => <Commissioner /> },
  officer: { width: 9, height: 18, team: 'police', walk: 30, run: 82, sprite: () => <OfficerAlone /> },
  lady: { width: 9, height: 18, team: 'civil', walk: 21, run: 50, sprite: () => <Lady /> },
  robbers: {
    width: 20,
    height: 18,
    team: 'robber',
    walk: 28,
    run: 66,
    sprite: (pose) => <Robbers pose={pose === 'handsUp' ? 'handsUp' : pose === 'loot' ? 'loot' : 'walk'} />,
  },
  thief: {
    width: 9,
    height: 18,
    team: 'robber',
    walk: 30,
    run: 72,
    sprite: (pose) => <Thief withBag={pose === 'loot'} handsUp={pose === 'handsUp'} />,
  },
  car: {
    width: 34,
    height: 14,
    team: 'police',
    vehicle: true,
    walk: 120,
    run: 190,
    sprite: () => <PoliceCar />,
  },
  bike: {
    width: 20,
    height: 16,
    team: 'police',
    vehicle: true,
    walk: 140,
    run: 210,
    sprite: () => <PoliceBiker />,
  },
}

/** Personnages qui arrivent d'eux-mêmes sur la page, avec leur fréquence relative. */
const WALKERS: [KindName, number][] = [
  ['dogOfficer', 3],
  ['officer', 2],
  ['colleagues', 2],
  ['chief', 1],
  ['lady', 2],
  ['thief', 1],
]

const GRAVITY = 1800
const BANK_WIDTH = 54
const PLATFORM_SELECTOR =
  'main article, main aside, main h1, main h2, main .rounded-lg, main .rounded-md, main li > a, [data-town-platform]'

type Platform = { x1: number; x2: number; y: number; street?: boolean }

type Mode = 'appear' | 'walk' | 'idle' | 'fall' | 'held' | 'stunned' | 'arrested' | 'leave'

type Agent = {
  id: number
  kind: KindName
  pose: Pose
  x: number
  /** Position des pieds. */
  y: number
  vx: number
  vy: number
  dir: 1 | -1
  mode: Mode
  until: number
  tumble: boolean
  spin: number
  /** Hauteur de départ d'une chute provoquée par un clic : il ne peut atterrir que plus bas. */
  through: number | null
  opacity: number
  born: number
  bubble: string | null
  bubbleUntil: number
  offscreenSince: number | null
  running: boolean
  root?: HTMLDivElement | null
  body?: HTMLDivElement | null
  label?: HTMLSpanElement | null
}

type Town = {
  platforms: Platform[]
  street: Platform | null
  stationX: number
  bankX: number
  width: number
  height: number
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

function pick<T>(entries: [T, number][]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll <= 0) return value
  }
  return entries[0]![0]
}

/** Relève les plateformes (haut des éléments visibles) et la rue, en coordonnées du calque. */
function measure(layer: HTMLElement): Town {
  const origin = layer.getBoundingClientRect()
  const platforms: Platform[] = []
  for (const element of document.querySelectorAll<HTMLElement>(PLATFORM_SELECTOR)) {
    if (element.closest('[data-town-ignore], .town')) continue
    const rect = element.getBoundingClientRect()
    if (rect.width < 60 || rect.height < 20) continue
    platforms.push({
      x1: rect.left - origin.left,
      x2: rect.right - origin.left,
      y: Math.round(rect.top - origin.top),
    })
    if (platforms.length > 160) break
  }
  const footer = document.querySelector<HTMLElement>('[data-town-street]')
  const container = footer?.querySelector<HTMLElement>('.max-w-page')
  let street: Platform | null = null
  let stationX = 16
  let bankX = origin.width - BANK_WIDTH - 16
  if (footer) {
    const rect = footer.getBoundingClientRect()
    street = { x1: 0, x2: origin.width, y: Math.round(rect.top - origin.top), street: true }
    platforms.push(street)
    if (container) {
      const inner = container.getBoundingClientRect()
      stationX = Math.max(8, inner.left - origin.left + 8)
      bankX = Math.min(origin.width - BANK_WIDTH - 8, inner.right - origin.left - BANK_WIDTH - 8)
    }
  }
  return { platforms, street, stationX, bankX, width: origin.width, height: origin.height }
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

type Rendered = { id: number; kind: KindName; pose: Pose }

export function PoliceTown() {
  const enabled = useTownEnabled()
  const reduced = useReducedMotion()
  const layer = useRef<HTMLDivElement>(null)
  const station = useRef<HTMLDivElement>(null)
  const bank = useRef<HTMLDivElement>(null)
  const alarm = useRef<HTMLSpanElement>(null)
  const agents = useRef(new Map<number, Agent>())
  const town = useRef<Town | null>(null)
  const [rendered, setRendered] = useState<Rendered[]>([])
  const drag = useRef<{
    id: number
    dx: number
    dy: number
    startX: number
    startY: number
    t: number
    moved: boolean
    vx: number
    vy: number
    lastX: number
    lastY: number
    lastT: number
  } | null>(null)
  const active = enabled && !reduced

  useEffect(() => {
    const root = layer.current
    if (!enabled || !root) return
    const population = agents.current
    let nextId = 1
    let frame = 0
    let last = performance.now()
    let lastMeasure = 0
    let nextSpawn = last + 400
    let nextRobbery = last + random(20000, 40000)
    let nextPatrol = last + random(8000, 16000)

    const sync = () =>
      setRendered([...agents.current.values()].map(({ id, kind, pose }) => ({ id, kind, pose })))

    const placeBuildings = (current: Town) => {
      if (!current.street) return
      if (station.current) {
        station.current.style.transform = `translate(${current.stationX}px, ${current.street.y - 40}px)`
      }
      if (bank.current)
        bank.current.style.transform = `translate(${current.bankX}px, ${current.street.y - 40}px)`
    }

    const refresh = (now: number) => {
      town.current = measure(root)
      lastMeasure = now
      placeBuildings(town.current)
    }
    refresh(last)
    const onResize = () => refresh(performance.now())
    window.addEventListener('resize', onResize)

    // Navigateurs automatisés (tests) : pas de personnages, ils pourraient intercepter les clics.
    if (!active || navigator.webdriver) {
      // Sans animation : les bâtiments restent posés sur la rue, même si la page change.
      const timer = window.setInterval(() => refresh(performance.now()), 1500)
      return () => {
        window.clearInterval(timer)
        window.removeEventListener('resize', onResize)
      }
    }

    const spawn = (
      kind: KindName,
      x: number,
      y: number,
      mode: Mode,
      pose: Pose = 'walk',
      dir: 1 | -1 = 1,
    ) => {
      const agent: Agent = {
        id: nextId++,
        kind,
        pose,
        x,
        y,
        vx: 0,
        vy: 0,
        dir,
        mode,
        until: 0,
        tumble: false,
        spin: 0,
        through: null,
        opacity: 0,
        born: performance.now(),
        bubble: null,
        bubbleUntil: 0,
        offscreenSince: null,
        running: false,
      }
      agents.current.set(agent.id, agent)
      sync()
      return agent
    }

    const say = (agent: Agent, text: string, now: number, ms = 1800) => {
      agent.bubble = text
      agent.bubbleUntil = now + ms
    }

    const setPose = (agent: Agent, pose: Pose) => {
      if (agent.pose === pose) return
      agent.pose = pose
      sync()
    }

    const platformUnder = (agent: Agent, current: Town) => {
      const kind = KINDS[agent.kind]
      const center = agent.x + kind.width / 2
      return current.platforms.find(
        (platform) =>
          Math.abs(platform.y - agent.y) <= 4 &&
          center >= platform.x1 &&
          center <= platform.x2 &&
          (!kind.vehicle || platform.street),
      )
    }

    const doorX = (current: Town, building: 'station' | 'bank') =>
      building === 'station' ? current.stationX + 23 : current.bankX + BANK_WIDTH / 2

    const spawnWalker = (current: Town) => {
      const kind = pick(WALKERS)
      const width = KINDS[kind].width
      const top = -root.getBoundingClientRect().top
      const visible = current.platforms.filter(
        (platform) =>
          !platform.street &&
          platform.y > top + 60 &&
          platform.y < top + window.innerHeight - 20 &&
          platform.x2 - platform.x1 > width + 20,
      )
      if (visible.length > 0 && Math.random() < 0.75) {
        // Apparaît sur une plateforme visible prise au hasard.
        const platform = visible[Math.floor(Math.random() * visible.length)]!
        const x = random(platform.x1 + 4, platform.x2 - width - 4)
        const agent = spawn(kind, x, platform.y, 'appear', kind === 'thief' ? 'loot' : 'walk')
        agent.dir = Math.random() < 0.5 ? 1 : -1
        return
      }
      if (current.street) {
        const agent = spawn(kind, doorX(current, 'station') - width / 2, current.street.y, 'appear')
        agent.dir = 1
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (now - lastMeasure > 1500) refresh(now)
      const current = town.current
      if (!current) {
        frame = requestAnimationFrame(tick)
        return
      }
      const street = current.street
      const viewTop = -root.getBoundingClientRect().top
      const viewBottom = viewTop + window.innerHeight
      const list = [...agents.current.values()]
      const walkers = list.filter((agent) => !KINDS[agent.kind].vehicle && agent.kind !== 'robbers')
      const target = window.innerWidth < 640 ? 4 : 7

      // Arrivées.
      if (now > nextSpawn) {
        // Arrivées rapprochées tant que la page est peu peuplée.
        nextSpawn = now + (walkers.length < 3 ? random(600, 1200) : random(2500, 5000))
        if (walkers.length < target) spawnWalker(current)
      }
      if (street && now > nextRobbery) {
        nextRobbery = now + random(45000, 80000)
        if (!list.some((agent) => agent.kind === 'robbers')) {
          const robbers = spawn('robbers', doorX(current, 'bank') - 10, street.y, 'appear', 'loot', -1)
          say(robbers, '€', now, 3000)
          // La voiture de police sort du commissariat peu après.
          window.setTimeout(() => {
            const vehicles = [...agents.current.values()].filter((agent) => KINDS[agent.kind].vehicle)
            if (!town.current?.street || vehicles.length > 1) return
            spawn('car', doorX(town.current, 'station') - 17, town.current.street.y, 'appear', 'walk', 1)
          }, 1800)
        }
      }
      if (street && now > nextPatrol) {
        nextPatrol = now + random(20000, 40000)
        if (list.filter((agent) => KINDS[agent.kind].vehicle).length === 0) {
          spawn(Math.random() < 0.5 ? 'bike' : 'car', doorX(current, 'station') - 15, street.y, 'appear')
        }
      }

      const looting = list.some((agent) => agent.kind === 'robbers' && agent.pose === 'loot')
      if (alarm.current) alarm.current.style.opacity = looting ? '1' : '0'

      for (const agent of list) {
        const kind = KINDS[agent.kind]
        const width = kind.width

        if (agent.bubble && now > agent.bubbleUntil) agent.bubble = null
        if (agent.mode !== 'leave') agent.opacity = Math.min(1, agent.opacity + dt * 3)

        switch (agent.mode) {
          case 'appear': {
            if (agent.opacity >= 1) agent.mode = 'walk'
            break
          }
          case 'leave': {
            agent.opacity -= dt * 2.5
            if (agent.opacity <= 0) {
              agents.current.delete(agent.id)
              sync()
            }
            break
          }
          case 'held':
            break
          case 'idle': {
            if (now > agent.until) agent.mode = 'walk'
            break
          }
          case 'stunned': {
            if (now > agent.until) {
              agent.mode = 'walk'
              agent.tumble = false
              agent.spin = 0
            }
            break
          }
          case 'arrested': {
            if (now > agent.until) agent.mode = 'leave'
            break
          }
          case 'fall': {
            agent.vy += GRAVITY * dt
            agent.x += agent.vx * dt
            agent.vx *= 1 - dt * 0.8
            if (agent.tumble) agent.spin += dt * 720 * (agent.vx >= 0 ? 1 : -1)
            const nextY = agent.y + agent.vy * dt
            const center = agent.x + width / 2
            const landing =
              agent.vy > 0
                ? current.platforms
                    .filter(
                      (platform) =>
                        platform.y >= agent.y - 1 &&
                        platform.y <= nextY &&
                        center >= platform.x1 &&
                        center <= platform.x2 &&
                        (agent.through === null || platform.y > agent.through + 2) &&
                        (!kind.vehicle || platform.street),
                    )
                    .sort((a, b) => a.y - b.y)[0]
                : undefined
            const floor = street?.y ?? current.height
            if (landing || nextY >= floor) {
              agent.y = landing ? landing.y : floor
              agent.x = Math.max(0, Math.min(current.width - width, agent.x))
              const hard = agent.tumble || agent.vy > 1100
              agent.vy = 0
              agent.vx = 0
              agent.through = null
              if (hard) {
                agent.mode = 'stunned'
                agent.until = now + 1400
                agent.spin = 0
                say(agent, '★', now, 1400)
              } else {
                agent.mode = 'walk'
                agent.tumble = false
                agent.spin = 0
              }
            } else agent.y = nextY
            break
          }
          case 'walk': {
            const platform = platformUnder(agent, current)
            if (!platform) {
              agent.mode = 'fall'
              agent.vx = agent.dir * kind.walk
              break
            }
            let speed = kind.walk
            agent.running = false
            // Poursuites sur la même plateforme.
            if (kind.team === 'police') {
              const robber = list.find(
                (other) =>
                  KINDS[other.kind].team === 'robber' &&
                  (other.mode === 'walk' || other.mode === 'idle') &&
                  Math.abs(other.y - agent.y) <= 4 &&
                  Math.abs(other.x - agent.x) < 280,
              )
              if (robber) {
                agent.dir = robber.x > agent.x ? 1 : -1
                speed = kind.run
                agent.running = true
                const reach = (KINDS[robber.kind].width + width) / 2
                if (Math.abs(robber.x + KINDS[robber.kind].width / 2 - (agent.x + width / 2)) < reach) {
                  robber.mode = 'arrested'
                  robber.until = now + 1800
                  setPose(robber, 'handsUp')
                  say(robber, '!', now, 1800)
                  say(agent, '★', now, 1500)
                  agent.mode = 'idle'
                  agent.until = now + 1600
                  break
                }
              }
            } else if (kind.team === 'robber') {
              const cop = list.find(
                (other) =>
                  KINDS[other.kind].team === 'police' &&
                  other.mode === 'walk' &&
                  Math.abs(other.y - agent.y) <= 4 &&
                  Math.abs(other.x - agent.x) < 220,
              )
              if (cop) {
                agent.dir = cop.x > agent.x ? -1 : 1
                speed = kind.run
                agent.running = true
                if (!agent.bubble) say(agent, '!', now, 900)
              }
            }

            agent.x += agent.dir * speed * dt
            const min = platform.x1 - width / 2 + 2
            const max = platform.x2 - width / 2 - 2
            if (agent.x < min || agent.x > max) {
              if (platform.street || kind.vehicle || Math.random() < 0.55) {
                agent.x = Math.max(min, Math.min(max, agent.x))
                agent.dir = agent.dir === 1 ? -1 : 1
              } else {
                agent.mode = 'fall'
                agent.vx = agent.dir * speed
                agent.vy = -60
              }
              break
            }
            // Pauses et départs.
            if (Math.random() < dt * 0.08 && speed === kind.walk) {
              agent.mode = 'idle'
              agent.until = now + random(800, 2600)
            }
            const age = now - agent.born
            if (platform.street && age > 25000) {
              const home = kind.team === 'robber' ? null : doorX(current, 'station')
              if (home !== null && Math.abs(agent.x + width / 2 - home) < 6) agent.mode = 'leave'
            }
            if (kind.vehicle && age > 30000) agent.mode = 'leave'
            break
          }
        }

        // Personnages restés loin de l'écran : remplacés par d'autres, plus près.
        const farAway = agent.y < viewTop - window.innerHeight || agent.y > viewBottom + window.innerHeight
        if (farAway && agent.mode !== 'held') {
          agent.offscreenSince ??= now
          if (now - agent.offscreenSince > 8000) {
            agents.current.delete(agent.id)
            sync()
            continue
          }
        } else agent.offscreenSince = null

        // Rendu.
        if (agent.root) {
          agent.root.style.transform = `translate(${Math.round(agent.x)}px, ${Math.round(agent.y - kind.height)}px)`
          agent.root.style.opacity = String(Math.max(0, Math.min(1, agent.opacity)))
        }
        if (agent.body) {
          const lying = agent.mode === 'stunned' || agent.mode === 'held'
          const angle =
            agent.mode === 'stunned'
              ? agent.dir * -90
              : agent.mode === 'held'
                ? Math.sin(now / 90) * 18
                : agent.spin
          agent.body.style.transform = `rotate(${angle}deg) scaleX(${agent.dir})`
          agent.body.classList.toggle(
            'town-still',
            lying || agent.mode === 'idle' || agent.mode === 'arrested',
          )
          agent.body.classList.toggle('town-run', agent.running && agent.mode === 'walk')
        }
        if (agent.label) {
          agent.label.textContent = agent.bubble ?? ''
          agent.label.style.opacity = agent.bubble ? '1' : '0'
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      population.clear()
      setRendered([])
    }
  }, [enabled, active])

  // Attraper, déplacer, lâcher ; un simple clic fait trébucher.
  const onPointerDown = (id: number) => (event: ReactPointerEvent<HTMLDivElement>) => {
    const agent = agents.current.get(id)
    const root = layer.current
    if (!agent || !root) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const origin = root.getBoundingClientRect()
    const px = event.clientX - origin.left
    const py = event.clientY - origin.top
    drag.current = {
      id,
      dx: px - agent.x,
      dy: py - agent.y,
      startX: event.clientX,
      startY: event.clientY,
      t: event.timeStamp,
      moved: false,
      vx: 0,
      vy: 0,
      lastX: px,
      lastY: py,
      lastT: event.timeStamp,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    const root = layer.current
    if (!state || !root) return
    const agent = agents.current.get(state.id)
    if (!agent) return
    if (!state.moved && Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < 4) return
    state.moved = true
    const origin = root.getBoundingClientRect()
    const px = event.clientX - origin.left
    const py = event.clientY - origin.top
    const now = event.timeStamp
    const elapsed = Math.max(1, now - state.lastT) / 1000
    state.vx = (px - state.lastX) / elapsed
    state.vy = (py - state.lastY) / elapsed
    state.lastX = px
    state.lastY = py
    state.lastT = now
    agent.mode = 'held'
    agent.opacity = 1
    agent.x = px - state.dx
    agent.y = py - state.dy
    agent.bubble = '!'
    agent.bubbleUntil = now + 400
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    drag.current = null
    if (!state) return
    const agent = agents.current.get(state.id)
    if (!agent || agent.mode === 'leave') return
    const now = event.timeStamp
    if (!state.moved) {
      // Clic : le personnage trébuche et passe à travers sa plateforme.
      if (agent.mode === 'fall' || agent.mode === 'stunned') return
      agent.through = agent.mode === 'walk' || agent.mode === 'idle' ? Math.round(agent.y) : null
      agent.mode = 'fall'
      agent.tumble = true
      agent.vy = -320
      agent.vx = agent.dir * 60
      agent.bubble = '!'
      agent.bubbleUntil = now + 900
      return
    }
    agent.mode = 'fall'
    agent.tumble = Math.abs(state.vx) > 500
    agent.vx = Math.max(-700, Math.min(700, state.vx * 0.6))
    agent.vy = Math.max(-600, Math.min(600, state.vy * 0.4))
    if (agent.vx !== 0) agent.dir = agent.vx > 0 ? 1 : -1
  }

  if (!enabled) return null

  return (
    <div
      ref={layer}
      aria-hidden
      className="town pointer-events-none absolute inset-0 z-20 overflow-hidden select-none print:hidden"
    >
      <div ref={station} className="absolute top-0 left-0">
        <PoliceStation />
      </div>
      <div ref={bank} className="absolute top-0 left-0">
        <Bank />
        <span
          ref={alarm}
          className="town-alarm absolute top-0 left-[24px] size-[6px] rounded-full bg-red-500 opacity-0"
        />
      </div>
      {rendered.map(({ id, kind, pose }) => (
        <div
          key={id}
          ref={(node) => {
            const agent = agents.current.get(id)
            if (agent) agent.root = node
          }}
          onPointerDown={onPointerDown(id)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="pointer-events-auto absolute top-0 left-0 cursor-grab touch-none opacity-0 active:cursor-grabbing"
          style={{ width: KINDS[kind].width, height: KINDS[kind].height }}
        >
          <span
            ref={(node) => {
              const agent = agents.current.get(id)
              if (agent) agent.label = node
            }}
            className="border-slate-300 shadow-sm absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 rounded-sm border bg-white px-[3px] text-[9px] leading-[11px] font-bold text-red-600 opacity-0"
          />
          <div
            ref={(node) => {
              const agent = agents.current.get(id)
              if (agent) agent.body = node
            }}
            className="town-agent origin-bottom"
          >
            {KINDS[kind].sprite(pose)}
          </div>
        </div>
      ))}
    </div>
  )
}
