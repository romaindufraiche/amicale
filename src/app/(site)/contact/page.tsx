import type { Metadata } from 'next'
import { MessageCircle } from 'lucide-react'
import { site } from '@/config/site'
import { whatsappUrl } from '@/lib/whatsapp'
import { Eyebrow, PageHeader } from '@/components/ui/page-header'
import { ContactForm } from '@/features/contact/components/contact-form'
import { getCurrentSession } from '@/server/auth/session'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Écrire au bureau de l'${site.legalName}.`,
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const session = await getCurrentSession()
  const { contact } = site
  const hasDetails = contact.email || contact.phone || contact.postalAddress || contact.officeHours

  return (
    <div className="mx-auto grid max-w-page gap-14 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.6fr_1fr] lg:px-8">
      <div className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Contact"
          title="Écrire au bureau"
          lead="Adhésion, commande, sortie, partenariat : le bureau vous répond par email."
        />
        <ContactForm
          defaultName={session ? `${session.user.firstName} ${session.user.lastName}` : undefined}
          defaultEmail={session?.user.email}
        />
      </div>

      <aside className="flex flex-col gap-6 self-start rounded-lg bg-surface p-8 shadow-raised lg:mt-40">
        <Eyebrow>Bon à savoir</Eyebrow>
        {contact.whatsapp ? (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Une question rapide ? Écrivez-nous sur WhatsApp.</p>
            <a
              href={whatsappUrl(
                contact.whatsapp,
                `Bonjour, je vous contacte depuis le site de l’${site.shortName}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 self-start rounded-sm bg-whatsapp px-5 font-display font-bold text-white hover:bg-whatsapp-hover"
            >
              <MessageCircle aria-hidden className="size-5" />
              {contact.whatsapp}
              <span className="sr-only">(WhatsApp, nouvel onglet)</span>
            </a>
          </div>
        ) : null}
        {hasDetails ? (
          <dl className="flex flex-col gap-4">
            {contact.postalAddress ? (
              <div>
                <dt className="label-caps text-ink-muted">Adresse</dt>
                <dd className="whitespace-pre-line">{contact.postalAddress}</dd>
              </div>
            ) : null}
            {contact.officeHours ? (
              <div>
                <dt className="label-caps text-ink-muted">Permanences</dt>
                <dd className="whitespace-pre-line">{contact.officeHours}</dd>
              </div>
            ) : null}
            {contact.phone ? (
              <div>
                <dt className="label-caps text-ink-muted">Téléphone</dt>
                <dd>
                  <a className="link" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                    {contact.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {contact.email ? (
              <div>
                <dt className="label-caps text-ink-muted">Email</dt>
                <dd>
                  <a className="break-all link" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <p className="text-sm text-ink-muted">
          Pour une question sur une commande, indiquez sa référence (ex. C-000042) : elle figure dans votre
          espace et dans l’email de confirmation.
        </p>
      </aside>
    </div>
  )
}
