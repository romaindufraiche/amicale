import type { HighlightTone } from '@/server/db/schema'

/** Couleurs proposées pour un post, toutes issues de la palette de marque. */
export const HIGHLIGHT_TONES: Record<HighlightTone, { label: string; classes: string }> = {
  RED: { label: 'Rouge ADPVO', classes: 'bg-red-600 text-white' },
  NIGHT: { label: 'Noir', classes: 'bg-night-900 text-white' },
  AMBER: { label: 'Ambre', classes: 'bg-amber-300 text-ink' },
  BLUE: { label: 'Bleu', classes: 'bg-blue-700 text-white' },
  SAND: { label: 'Sable', classes: 'bg-sunken text-ink' },
}

export const HIGHLIGHT_TONE_VALUES = Object.keys(HIGHLIGHT_TONES) as HighlightTone[]
