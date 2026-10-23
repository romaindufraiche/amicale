'use client'

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'adpvo-petits-personnages'
const CHANGE_EVENT = 'adpvo-town-change'

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

/** Préférence du visiteur : petits personnages affichés ou masqués (mémorisée dans ce navigateur). */
export function useTownEnabled(): boolean {
  return useSyncExternalStore(subscribe, readEnabled, () => true)
}

export function setTownEnabled(enabled: boolean) {
  try {
    if (enabled) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, 'off')
  } catch {
    // Stockage indisponible (navigation privée) : la préférence vaut pour cette page seulement.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}
