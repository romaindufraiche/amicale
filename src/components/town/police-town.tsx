'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { Bank, PoliceStation } from './sprites'
import { type Anchor, STORIES, type Step, type Story, type Track } from './stories'
import { useTownEnabled } from './town-store'

/** Commissariat (bord gauche, à partir de 640 px) et banque (à partir de 1024 px). */
const STATION_LEFT = 8
const DOOR_X = STATION_LEFT + 23
const STATION_MIN_WIDTH = 640
const BANK_MIN_WIDTH = 1024
const BANK_CENTER = 0.45
/** Durée d'apparition ou de disparition (entrée et sortie des bâtiments), en ms. */
const FADE_MS = 300

const BUBBLE_COLORS: Record<NonNullable<Step['bubble']>, string> = {
  '!': 'text-red-600',
  '€': 'text-emerald-700',
  '♥': 'text-rose-600',
  '♪': 'text-blue-700',
  '?': 'text-blue-700',
}

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

/** Abscisse du bord gauche d'un personnage centré sur le repère. */
function resolve(anchor: Anchor, width: number, viewport: number): number {
  const center =
    anchor === 'offL'
      ? -width / 2 - 12
      : anchor === 'offR'
        ? viewport + width / 2 + 12
        : anchor === 'door'
          ? viewport >= STATION_MIN_WIDTH
            ? DOOR_X
            : -width / 2 - 12
          : anchor === 'bank'
            ? viewport * BANK_CENTER
            : viewport * anchor
  return Math.round(center - width / 2)
}

type Frames = { move: Keyframe[]; flip: Keyframe[]; bubbles: Map<string, Keyframe[]> }

/** Traduit les étapes d'un personnage en images clés (Web Animations) sur la durée de l'histoire. */
function framesFor(track: Track, story: Story, viewport: number): Frames {
  const total = story.duration * 1000
  const epsilon = 1 / total
  const move: Keyframe[] = []
  const flip: Keyframe[] = []
  let last = 0
  const clamp = (value: number) => {
    last = Math.min(1, Math.max(last, value))
    return last
  }
  const at = (offset: number, x: number, opacity: number) =>
    move.push({ offset: clamp(offset), transform: `translateX(${Math.round(x)}px)`, opacity })

  const steps = track.steps
  const first = steps[0]
  if (!first) return { move: [{ opacity: 0 }, { opacity: 0 }], flip: [], bubbles: new Map() }
  const start = resolve(first.from, track.width, viewport)
  if (first.at > 0) {
    // Caché jusqu'à son entrée en scène.
    at(0, start, 0)
    at((first.at * 1000) / total - epsilon, start, 0)
  }

  steps.forEach((step, index) => {
    const from = resolve(step.from, track.width, viewport)
    const to = resolve(step.to ?? step.from, track.width, viewport)
    const s = (step.at * 1000) / total
    const e = ((step.at + step.dur) * 1000) / total
    const fade = Math.min(FADE_MS, (step.dur * 1000) / 2)
    const lerp = (ratio: number) => from + (to - from) * ratio
    if (step.fadeIn) {
      at(s, from, 0)
      at(s + fade / total, lerp(fade / (step.dur * 1000)), 1)
    } else at(s, from, 1)
    if (step.fadeOut) {
      at(e - fade / total, lerp(1 - fade / (step.dur * 1000)), 1)
      at(e, to, 0)
    } else at(e, to, 1)
    const next = steps[index + 1]
    if (next) {
      // Reste sur place (ou caché s'il est entré dans un bâtiment) jusqu'à l'étape suivante.
      at((next.at * 1000) / total - epsilon, to, step.fadeOut ? 0 : 1)
    } else {
      at(e + epsilon, to, 0)
      at(1, to, 0)
    }
  })

  // Regard : droite ou gauche, sans demi-tour progressif.
  let flipLast = 0
  const face = (offset: number, step: Step) => {
    const from = resolve(step.from, track.width, viewport)
    const to = resolve(step.to ?? step.from, track.width, viewport)
    const direction = step.face ?? (to < from ? 'left' : 'right')
    flipLast = Math.min(1, Math.max(flipLast, offset))
    flip.push({ offset: flipLast, transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)' })
  }
  steps.forEach((step, index) => {
    face((step.at * 1000) / total, step)
    const next = steps[index + 1]
    face(next ? (next.at * 1000) / total - epsilon : 1, step)
  })

  const bubbles = new Map<string, Keyframe[]>()
  for (const glyph of new Set(steps.map((step) => step.bubble).filter(Boolean))) {
    const frames: Keyframe[] = [{ offset: 0, opacity: 0 }]
    let bubbleLast = 0
    const push = (offset: number, opacity: number) => {
      bubbleLast = Math.min(1, Math.max(bubbleLast, offset))
      frames.push({ offset: bubbleLast, opacity })
    }
    for (const step of steps.filter((candidate) => candidate.bubble === glyph)) {
      const s = (step.at * 1000) / total
      const e = ((step.at + step.dur) * 1000) / total
      push(s, 0)
      push(s + 200 / total, 1)
      push(e - 200 / total, 1)
      push(e, 0)
    }
    push(1, 0)
    bubbles.set(glyph as string, frames)
  }
  return { move, flip, bubbles }
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

const trackKey = (story: Story, index: number) => `${story.id}:${index}`

/**
 * Petite ville en bas de l'écran : un commissariat, une banque, et de petites histoires
 * jouées l'une après l'autre (braquage, vol de sac, excès de vitesse, chien fugueur,
 * patrouille, relève). Purement décorative : masquée aux lecteurs d'écran, sans effet sur
 * les clics, immobile si le visiteur a demandé à réduire les animations, et désactivable
 * depuis le pied de page.
 */
export function PoliceTown() {
  const enabled = useTownEnabled()
  const reduced = useReducedMotion()
  const nodes = useRef(new Map<string, HTMLElement>())
  const alarm = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!enabled || reduced) return
    const controller = new AbortController()
    const { signal } = controller
    const running = new Set<Animation>()

    const play = async (story: Story, viewport: number) => {
      const animations: Animation[] = []
      const timing = { duration: story.duration * 1000, fill: 'both' as const }
      story.tracks.forEach((track, index) => {
        const key = trackKey(story, index)
        const actor = nodes.current.get(`${key}:actor`)
        const flip = nodes.current.get(`${key}:flip`)
        if (!actor || !flip) return
        const frames = framesFor(track, story, viewport)
        animations.push(actor.animate(frames.move, { ...timing, easing: 'linear' }))
        if (frames.flip.length > 0) animations.push(flip.animate(frames.flip, timing))
        for (const [glyph, keyframes] of frames.bubbles) {
          const bubble = nodes.current.get(`${key}:bubble:${glyph}`)
          if (bubble) animations.push(bubble.animate(keyframes, timing))
        }
      })
      if (story.bankAlarm && alarm.current) {
        const [from, length] = story.bankAlarm
        const total = story.duration
        animations.push(
          alarm.current.animate(
            [
              { offset: 0, opacity: 0 },
              { offset: from / total, opacity: 0 },
              { offset: Math.min(1, (from + 0.2) / total), opacity: 1 },
              { offset: Math.min(1, (from + length) / total), opacity: 1 },
              { offset: Math.min(1, (from + length + 0.2) / total), opacity: 0 },
              { offset: 1, opacity: 0 },
            ],
            timing,
          ),
        )
      }
      for (const animation of animations) running.add(animation)
      try {
        await Promise.all(animations.map((animation) => animation.finished))
      } catch {
        // Histoire interrompue (page quittée ou personnages masqués).
      }
      for (const animation of animations) {
        animation.cancel()
        running.delete(animation)
      }
    }

    void (async () => {
      let previous: string | null = null
      await sleep(1500, signal)
      while (!signal.aborted) {
        const viewport = window.innerWidth
        const choices = STORIES.filter(
          (story) => story.id !== previous && (!story.needsBank || viewport >= BANK_MIN_WIDTH),
        )
        const story = choices[Math.floor(Math.random() * choices.length)]
        if (!story) return
        previous = story.id
        await play(story, viewport)
        await sleep(random(3000, 7000), signal)
      }
    })()

    return () => {
      controller.abort()
      for (const animation of running) animation.cancel()
    }
  }, [enabled, reduced])

  if (!enabled) return null

  const register = (key: string) => (node: HTMLElement | null) => {
    if (node) nodes.current.set(key, node)
    else nodes.current.delete(key)
  }

  return (
    <div
      aria-hidden
      className="town pointer-events-none fixed inset-x-0 bottom-0 z-30 h-12 select-none print:hidden"
    >
      <div className="absolute bottom-0 hidden sm:block" style={{ left: STATION_LEFT }}>
        <PoliceStation />
      </div>
      <div
        className="absolute bottom-0 hidden lg:block"
        style={{ left: `calc(${BANK_CENTER * 100}% - 27px)` }}
      >
        <Bank />
        <span
          ref={alarm}
          className="town-alarm absolute top-0 left-[24px] size-[6px] rounded-full bg-red-500 opacity-0"
        />
      </div>
      {STORIES.flatMap((story) =>
        story.tracks.map((track, index) => {
          const key = trackKey(story, index)
          const glyphs = [...new Set(track.steps.map((step) => step.bubble).filter(Boolean))]
          const runs = track.steps.some((step) => step.run)
          return (
            <div
              key={key}
              ref={register(`${key}:actor`)}
              className="absolute bottom-0.5 left-0 opacity-0 will-change-transform"
            >
              {glyphs.map((glyph) => (
                <span
                  key={glyph}
                  ref={register(`${key}:bubble:${glyph}`)}
                  className={cn(
                    'border-slate-300 shadow-sm absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 rounded-sm border bg-white px-[3px] text-[9px] leading-[11px] font-bold opacity-0',
                    BUBBLE_COLORS[glyph as NonNullable<Step['bubble']>],
                  )}
                >
                  {glyph}
                </span>
              ))}
              <div ref={register(`${key}:flip`)} className={cn(runs && 'town-run')}>
                {track.sprite}
              </div>
            </div>
          )
        }),
      )}
    </div>
  )
}
