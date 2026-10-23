import type { ReactNode } from 'react'
import {
  Commissioner,
  DogAlone,
  Escort,
  Lady,
  OfficerAlone,
  OfficerWithDog,
  PoliceBiker,
  PoliceCar,
  Robbers,
  SportsCar,
  Thief,
  TwoColleagues,
} from './sprites'

/**
 * Repères de position : fraction de la largeur de l'écran (0 à 1), hors champ à gauche
 * ou à droite, porte du commissariat ou porte de la banque.
 */
export type Anchor = number | 'offL' | 'offR' | 'door' | 'bank'

/** Un moment de la vie d'un personnage : il va de `from` à `to` (ou reste sur place). */
export type Step = {
  /** Début, en secondes depuis le début de l'histoire. */
  at: number
  /** Durée, en secondes. */
  dur: number
  from: Anchor
  to?: Anchor
  /** Regard ; par défaut, celui du sens de la marche (droite si immobile). */
  face?: 'left' | 'right'
  /** Apparaît (sort d'un bâtiment) ou disparaît (y entre) pendant ce moment. */
  fadeIn?: boolean
  fadeOut?: boolean
  /** Petite bulle au-dessus du personnage. */
  bubble?: '!' | '€' | '♥' | '♪' | '?'
  /** Course : les jambes vont plus vite pendant tout le trajet du personnage. */
  run?: boolean
}

export type Track = { sprite: ReactNode; width: number; steps: Step[] }

export type Story = {
  id: string
  /** Résumé de l'histoire, pour les développeurs. */
  title: string
  duration: number
  /** Joue dans la banque : seulement sur les écrans assez larges pour l'afficher. */
  needsBank?: boolean
  /** Alarme de la banque : [début, durée] en secondes. */
  bankAlarm?: [number, number]
  tracks: Track[]
}

export const STORIES: Story[] = [
  {
    id: 'braquage',
    title:
      'Deux brigands entrent dans la banque, l’alarme sonne, ils s’enfuient avec les sacs ; la voiture de police les rattrape, ils lèvent les mains et sont ramenés au commissariat.',
    duration: 50,
    needsBank: true,
    bankAlarm: [10, 16],
    tracks: [
      { sprite: <Robbers />, width: 20, steps: [{ at: 0, dur: 9, from: 'offR', to: 'bank', fadeOut: true }] },
      {
        sprite: <Robbers pose="loot" />,
        width: 20,
        steps: [
          { at: 13, dur: 7, from: 'bank', to: 0.72, fadeIn: true, run: true, bubble: '€' },
          { at: 20, dur: 1.5, from: 0.72, face: 'left', fadeOut: true },
        ],
      },
      {
        sprite: <PoliceCar />,
        width: 34,
        steps: [
          { at: 13.5, dur: 7, from: 'door', to: 0.63, fadeIn: true },
          { at: 20.5, dur: 6, from: 0.63 },
          { at: 26.5, dur: 6, from: 0.63, to: 'door', fadeOut: true },
        ],
      },
      {
        sprite: <Robbers pose="handsUp" />,
        width: 20,
        steps: [{ at: 21.5, dur: 5, from: 0.72, face: 'left', fadeIn: true, fadeOut: true, bubble: '!' }],
      },
      {
        sprite: <TwoColleagues />,
        width: 20,
        steps: [{ at: 21, dur: 5.5, from: 0.63, to: 0.68, fadeIn: true, fadeOut: true }],
      },
      {
        sprite: <Escort />,
        width: 42,
        steps: [{ at: 26.5, dur: 23, from: 0.7, to: 'door', fadeIn: true, fadeOut: true }],
      },
    ],
  },
  {
    id: 'vol-de-sac',
    title:
      'Un voleur arrache le sac d’une passante et s’enfuit ; le motard lui barre la route, le sac est rendu et la passante repart soulagée.',
    duration: 46,
    tracks: [
      {
        sprite: <Lady />,
        width: 9,
        steps: [{ at: 0, dur: 14, from: 'offL', to: 0.5, fadeOut: false }],
      },
      {
        sprite: <Lady withBag={false} />,
        width: 9,
        steps: [
          { at: 14, dur: 14, from: 0.5, face: 'right', bubble: '!' },
          { at: 28, dur: 0.2, from: 0.5, fadeOut: true },
        ],
      },
      {
        sprite: <Thief />,
        width: 9,
        steps: [{ at: 5, dur: 9, from: 'offR', to: 0.53, fadeOut: false }],
      },
      {
        sprite: <Thief withBag />,
        width: 9,
        steps: [{ at: 14, dur: 4, from: 0.53, to: 0.75, run: true }],
      },
      {
        sprite: <PoliceBiker />,
        width: 20,
        steps: [
          { at: 15, dur: 3, from: 'offR', to: 0.81 },
          { at: 18, dur: 3, from: 0.81, face: 'left' },
          { at: 21, dur: 7, from: 0.81, to: 0.58 },
          { at: 28, dur: 4, from: 0.58, face: 'left' },
          { at: 32, dur: 3, from: 0.58, to: 'offL' },
        ],
      },
      {
        sprite: <Thief handsUp />,
        width: 9,
        steps: [
          { at: 18, dur: 3, from: 0.75, face: 'right', bubble: '!' },
          { at: 21, dur: 7, from: 0.75, to: 0.53, face: 'left' },
          { at: 28, dur: 4, from: 0.53, face: 'left' },
          { at: 32, dur: 14, from: 0.53, to: 'door', fadeOut: true },
        ],
      },
      {
        sprite: <Lady />,
        width: 9,
        steps: [
          { at: 28, dur: 4, from: 0.5, face: 'right', bubble: '♥' },
          { at: 32, dur: 14, from: 0.5, to: 'offR' },
        ],
      },
    ],
  },
  {
    id: 'exces-de-vitesse',
    title:
      'Une voiture rouge passe en trombe, la police la prend en chasse ; elle revient escortée et le policier dresse l’amende.',
    duration: 34,
    tracks: [
      {
        sprite: <SportsCar />,
        width: 32,
        steps: [
          { at: 0, dur: 2.5, from: 'offL', to: 'offR' },
          { at: 8, dur: 5, from: 'offR', to: 0.55 },
          { at: 13, dur: 12, from: 0.55, face: 'left' },
          { at: 25, dur: 6, from: 0.55, to: 'offL' },
        ],
      },
      {
        sprite: <PoliceCar />,
        width: 34,
        steps: [
          { at: 1, dur: 3.5, from: 'door', to: 'offR', fadeIn: true },
          { at: 8.3, dur: 5, from: 'offR', to: 0.7 },
          { at: 13.3, dur: 12, from: 0.7, face: 'left' },
          { at: 25.3, dur: 7, from: 0.7, to: 'door', fadeOut: true },
        ],
      },
      {
        sprite: <OfficerAlone />,
        width: 9,
        steps: [
          { at: 14, dur: 2.5, from: 0.68, to: 0.6, fadeIn: true },
          { at: 16.5, dur: 5, from: 0.6, face: 'left', bubble: '€' },
          { at: 21.5, dur: 2.5, from: 0.6, to: 0.68, fadeOut: true },
        ],
      },
    ],
  },
  {
    id: 'chien-fugueur',
    title: 'Le chien s’échappe du commissariat, son maître lui court après et le ramène.',
    duration: 27,
    tracks: [
      {
        sprite: <DogAlone />,
        width: 12,
        steps: [
          { at: 0, dur: 6, from: 'door', to: 0.3, fadeIn: true, run: true },
          { at: 6, dur: 3, from: 0.3, face: 'left', bubble: '♥', fadeOut: true },
        ],
      },
      {
        sprite: <OfficerAlone />,
        width: 9,
        steps: [
          { at: 1.5, dur: 7, from: 'door', to: 0.27, fadeIn: true, run: true, bubble: '!', fadeOut: true },
        ],
      },
      {
        sprite: <OfficerWithDog />,
        width: 24,
        steps: [{ at: 8.5, dur: 18, from: 0.29, to: 'door', fadeIn: true, fadeOut: true }],
      },
    ],
  },
  {
    id: 'patrouille',
    title: 'Le maître-chien part en patrouille ; le motard passe dans l’autre sens.',
    duration: 46,
    tracks: [
      {
        sprite: <OfficerWithDog />,
        width: 24,
        steps: [{ at: 0, dur: 46, from: 'door', to: 'offR', fadeIn: true }],
      },
      { sprite: <PoliceBiker />, width: 20, steps: [{ at: 14, dur: 6, from: 'offR', to: 'offL' }] },
    ],
  },
  {
    id: 'releve',
    title:
      'La relève : deux collègues rentrent au commissariat, deux autres partent ; le commissaire prend l’air en sifflotant.',
    duration: 62,
    tracks: [
      {
        sprite: <TwoColleagues />,
        width: 20,
        steps: [{ at: 0, dur: 32, from: 'offR', to: 'door', fadeOut: true }],
      },
      {
        sprite: <Commissioner />,
        width: 9,
        steps: [
          { at: 26, dur: 6, from: 'door', to: 0.12, fadeIn: true },
          { at: 32, dur: 5, from: 0.12, face: 'right', bubble: '♪' },
          { at: 37, dur: 6, from: 0.12, to: 'door', fadeOut: true },
        ],
      },
      {
        sprite: <TwoColleagues />,
        width: 20,
        steps: [{ at: 33, dur: 29, from: 'door', to: 'offR', fadeIn: true }],
      },
    ],
  },
]
