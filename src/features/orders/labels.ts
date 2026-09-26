import type { BadgeTone } from '@/components/ui/badge'
import type { OrderStatus } from '@/server/db/schema'

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone; description: string }> = {
  PENDING_PAYMENT: {
    label: 'À régler',
    tone: 'warning',
    description: 'Votre commande est réservée. Elle sera confirmée à réception de votre règlement.',
  },
  PAID: {
    label: 'Réglée',
    tone: 'info',
    description: 'Règlement reçu. Vos billets sont en cours de préparation.',
  },
  DELIVERED: { label: 'Remise', tone: 'success', description: 'Vos billets vous ont été remis.' },
  CANCELLED: { label: 'Annulée', tone: 'neutral', description: 'Cette commande a été annulée.' },
}

/** Libellés des actions du bureau pour chaque statut cible. */
export const ORDER_ACTION_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Remettre en attente',
  PAID: 'Marquer réglée',
  DELIVERED: 'Marquer remise',
  CANCELLED: 'Annuler la commande',
}

/** Affiché tant que les modalités de règlement ne sont pas renseignées dans `src/config/site.ts`. */
export const PAYMENT_FALLBACK =
  'Le bureau vous contactera pour convenir des modalités de règlement de votre commande.'
