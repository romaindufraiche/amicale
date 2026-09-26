import type { Metadata } from 'next'
import Link from 'next/link'
import { site } from '@/config/site'
import { PageHeader } from '@/components/ui/page-header'
import { Prose } from '@/components/ui/prose'

export const metadata: Metadata = {
  title: 'Données personnelles',
  description: 'Comment l’Amicale traite les données personnelles de ses adhérents.',
  alternates: { canonical: '/confidentialite' },
}

/*
 * Ce texte décrit le fonctionnement réel de l'application (données collectées, cookies,
 * sécurité). Les durées de conservation et le contact dédié doivent être validés par le bureau.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader
        eyebrow="Informations"
        title="Données personnelles"
        lead="Ce que nous collectons, pourquoi, et quels sont vos droits."
      />
      <Prose>
        <h2>Responsable du traitement</h2>
        <p>
          {site.legalName} ({site.legal.legalForm}). Pour toute question relative à vos données, écrivez au
          bureau via le <Link href="/contact">formulaire de contact</Link>.
        </p>

        <h2>Données collectées</h2>
        <ul>
          <li>Identité et coordonnées : nom, prénom, adresse email, téléphone (facultatif).</li>
          <li>
            Situation et service d’affectation déclarés, pour permettre au bureau d’examiner la demande
            d’adhésion.
          </li>
          <li>Données d’adhésion : numéro d’adhérent, date de fin de cotisation.</li>
          <li>Commandes passées sur la billetterie et inscriptions aux sorties.</li>
          <li>Messages envoyés via le formulaire de contact.</li>
        </ul>
        <p>
          Votre mot de passe n’est jamais stocké en clair : seule une empreinte irréversible (Argon2id) est
          conservée.
        </p>

        <h2>Finalités</h2>
        <ul>
          <li>Gestion des adhésions et de la vie de l’association.</li>
          <li>Traitement des commandes de billetterie et des inscriptions aux sorties.</li>
          <li>
            Envoi des emails nécessaires au service (confirmation de compte, commandes, réinitialisation du
            mot de passe).
          </li>
        </ul>
        <p>Vos données ne sont ni vendues, ni cédées, ni utilisées à des fins publicitaires.</p>

        <h2>Destinataires</h2>
        <p>
          Seuls les membres du bureau habilités accèdent aux données des adhérents, depuis un espace protégé.
          Aucune liste d’adhérents n’est publiée sur le site. Les actions du bureau sont tracées dans un
          journal d’audit.
        </p>

        <h2>Cookies</h2>
        <p>
          Le site utilise un unique cookie, strictement nécessaire à la connexion à l’espace adhérent. Il ne
          contient aucune donnée personnelle et expire après 14 jours d’inactivité. Aucun outil de mesure
          d’audience ni aucun traceur tiers n’est utilisé : aucun consentement n’est donc requis.
        </p>

        <h2>Vos droits</h2>
        <p>
          Conformément au Règlement général sur la protection des données, vous disposez d’un droit d’accès,
          de rectification, d’effacement, de limitation et d’opposition. Vous pouvez modifier certaines
          informations depuis votre espace ; pour les autres demandes, contactez le bureau. Vous pouvez
          également adresser une réclamation à la CNIL (cnil.fr).
        </p>
      </Prose>
    </div>
  )
}
