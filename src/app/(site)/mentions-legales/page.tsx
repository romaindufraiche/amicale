import type { Metadata } from 'next'
import Link from 'next/link'
import { site } from '@/config/site'
import { PageHeader } from '@/components/ui/page-header'
import { Prose } from '@/components/ui/prose'

export const metadata: Metadata = {
  title: 'Mentions légales',
  alternates: { canonical: '/mentions-legales' },
}

export default function LegalNoticePage() {
  const { legal, contact } = site
  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader eyebrow="Informations" title="Mentions légales" />
      <Prose>
        <h2>Éditeur du site</h2>
        <p>
          {site.legalName} ({site.shortName}), {legal.legalForm}.
          {legal.registrationNumber ? <> Numéro d’enregistrement : {legal.registrationNumber}.</> : null}
        </p>
        {contact.postalAddress ? <p className="whitespace-pre-line">{contact.postalAddress}</p> : null}
        {contact.email || contact.phone ? (
          <p>
            {contact.email ? (
              <>
                Email : <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </>
            ) : null}
            {contact.email && contact.phone ? ' · ' : null}
            {contact.phone ? <>Téléphone : {contact.phone}</> : null}
          </p>
        ) : (
          <p>
            Contact : <Link href="/contact">formulaire de contact</Link>.
          </p>
        )}
        {legal.publicationDirector ? (
          <p>Directeur ou directrice de la publication : {legal.publicationDirector}.</p>
        ) : null}

        {legal.host ? (
          <>
            <h2>Hébergement</h2>
            <p>
              {legal.host.name}
              <br />
              <span className="whitespace-pre-line">{legal.host.address}</span>
              {legal.host.phone ? (
                <>
                  <br />
                  {legal.host.phone}
                </>
              ) : null}
            </p>
          </>
        ) : null}

        <h2>Propriété intellectuelle</h2>
        <p>
          Le nom, le logo et les contenus de ce site sont la propriété de l’{site.shortName}. Toute
          reproduction sans autorisation préalable est interdite.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le traitement des données des adhérents est décrit dans la page{' '}
          <Link href="/confidentialite">Données personnelles</Link>.
        </p>

        <h2>Crédits</h2>
        <p>Polices de caractères Archivo et Source Sans 3, sous licence SIL Open Font License 1.1.</p>
      </Prose>
    </div>
  )
}
