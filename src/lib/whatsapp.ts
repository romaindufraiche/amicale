/**
 * Lien « click to chat » WhatsApp : ouvre une discussion avec un message prérempli.
 * « +33 7 68 16 98 67 » → https://wa.me/33768169867?text=…
 */
export function whatsappUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
