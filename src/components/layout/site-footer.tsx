import Link from 'next/link'
import { site } from '@/config/site'
import { whatsappUrl } from '@/lib/whatsapp'
import { Logo } from './logo'

const LINKS = [
  { href: '/offres', label: 'Offres' },
  { href: '/adherer', label: 'Adhérer' },
  { href: '/actualites', label: 'Actualités' },
  { href: '/contact', label: 'Contact' },
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/confidentialite', label: 'Données personnelles' },
] as const

export function SiteFooter() {
  const { contact } = site
  const hasContact = contact.email || contact.phone || contact.postalAddress

  return (
    <footer data-surface="dark" className="mt-auto bg-blue-900 text-white">
      <div className="brand-rule" aria-hidden />
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="flex flex-col gap-4">
          <Logo tone="light" />
          <p className="max-w-sm text-sm text-line">{site.description}</p>
        </div>

        <nav aria-label="Pied de page">
          <p className="mb-4 label-caps text-amber-300">Plan du site</p>
          <ul className="flex flex-col gap-2 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-white underline-offset-4 hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-4 label-caps text-amber-300">Nous joindre</p>
          {contact.whatsapp ? (
            <p className="mb-3 text-sm">
              <a
                href={whatsappUrl(contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                WhatsApp : {contact.whatsapp}
              </a>
            </p>
          ) : null}
          {hasContact ? (
            <address className="flex flex-col gap-2 text-sm not-italic">
              {contact.postalAddress ? (
                <span className="whitespace-pre-line">{contact.postalAddress}</span>
              ) : null}
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="underline-offset-4 hover:underline"
                >
                  {contact.phone}
                </a>
              ) : null}
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="underline-offset-4 hover:underline">
                  {contact.email}
                </a>
              ) : null}
            </address>
          ) : (
            <p className="text-sm">
              <Link href="/contact" className="underline underline-offset-4">
                Écrire au bureau
              </Link>
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-blue-800">
        <p className="mx-auto max-w-page px-4 py-5 text-caption text-line sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {site.legalName} · {site.legal.legalForm}
        </p>
      </div>
    </footer>
  )
}
