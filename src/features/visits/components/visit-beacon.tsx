'use client'

import { useEffect } from 'react'

/**
 * Signale une visite au serveur, une fois par chargement du site. Sans cookie ni
 * identifiant : le serveur ne conserve qu'un nombre de visites par jour.
 */
export function VisitBeacon() {
  useEffect(() => {
    try {
      navigator.sendBeacon('/api/visite')
    } catch {
      // Compteur indicatif : un échec n'a aucune conséquence pour le visiteur.
    }
  }, [])
  return null
}
