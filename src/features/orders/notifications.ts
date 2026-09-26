import 'server-only'
import { site } from '@/config/site'
import { formatEuros } from '@/lib/money'
import { env } from '@/server/env'
import { sendEmail } from '@/server/mail/transport'
import { PAYMENT_FALLBACK } from './labels'
import { getOrderNotificationData } from './queries'
import { formatOrderReference } from './rules'

/** Emails envoyés après validation de la transaction (un échec d'envoi n'annule pas la commande). */
export async function notifyOrder(orderId: string, event: 'created' | 'status_changed'): Promise<void> {
  const order = await getOrderNotificationData(orderId)
  if (!order) return
  const reference = formatOrderReference(order.number)
  const action = { label: 'Voir ma commande', url: `${env.APP_URL}/espace/commandes/${orderId}` }

  if (event === 'created') {
    await sendEmail(order.email, {
      subject: `Commande ${reference} enregistrée`,
      paragraphs: [
        `Bonjour ${order.firstName},`,
        `Votre commande ${reference} pour « ${order.offerTitle} » est enregistrée, pour un montant de ${formatEuros(order.totalCents)}.`,
        site.paymentInstructions ?? PAYMENT_FALLBACK,
        ...(order.pickupInfo ? [`Retrait des billets : ${order.pickupInfo}`] : []),
      ],
      action,
    })
    return
  }

  const messages: Partial<Record<typeof order.status, string>> = {
    PAID: `Nous avons bien reçu votre règlement pour la commande ${reference} (« ${order.offerTitle} »).`,
    DELIVERED: `Vos billets pour la commande ${reference} (« ${order.offerTitle} ») vous ont été remis.`,
    CANCELLED: `Votre commande ${reference} (« ${order.offerTitle} ») a été annulée. Pour toute question, contactez le bureau.`,
  }
  const message = messages[order.status]
  if (!message) return
  await sendEmail(order.email, {
    subject: `Commande ${reference} : mise à jour`,
    paragraphs: [`Bonjour ${order.firstName},`, message],
    action,
  })
}
