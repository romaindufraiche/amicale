import { MessageCircle } from 'lucide-react'
import { site } from '@/config/site'
import { whatsappUrl } from '@/lib/whatsapp'

const MESSAGE = `Bonjour, je vous contacte depuis le site de l’${site.shortName}.`

/** Bouton flottant pour écrire à l'Amicale sur WhatsApp (affiché si un numéro est configuré). */
export function WhatsAppButton() {
  if (!site.contact.whatsapp) return null
  return (
    <a
      href={whatsappUrl(site.contact.whatsapp, MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-40 inline-flex min-h-14 items-center gap-2 rounded-full bg-whatsapp px-5 font-display font-bold text-white shadow-overlay transition-colors hover:bg-whatsapp-hover sm:right-6 sm:bottom-6"
    >
      <MessageCircle aria-hidden className="size-6" />
      WhatsApp
      <span className="sr-only">: écrire à l’Amicale (nouvel onglet)</span>
    </a>
  )
}
