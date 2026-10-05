import type { Metadata } from 'next'
import Link from 'next/link'
import { site } from '@/config/site'
import { PageHeader } from '@/components/ui/page-header'
import { Prose } from '@/components/ui/prose'

export const metadata: Metadata = {
  title: 'Données personnelles',
  description: 'Comment l’Amicale traite les données personnelles collectées sur ce site.',
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
          <li>
            Demandes de commande : nom, prénom, adresse email, téléphone (facultatif) et offre choisie, saisis
            dans le formulaire « Commander » d’une offre.
          </li>
          <li>Messages envoyés via le formulaire de contact : nom, adresse email et contenu du message.</li>
          <li>Comptes des membres du bureau : nom, prénom, adresse email et mot de passe.</li>
        </ul>
        <p>
          Les mots de passe ne sont jamais stockés en clair : seule une empreinte irréversible (Argon2id) est
          conservée.
        </p>

        <h2>Paiements et adhésions sur HelloAsso</h2>
        <p>
          Les adhésions et les paiements des commandes se font sur HelloAsso, plateforme de paiement des
          associations. Le site de l’Amicale ne voit ni ne conserve aucune donnée bancaire. Les informations
          saisies sur HelloAsso sont traitées selon la politique de confidentialité de HelloAsso.
        </p>

        <h2>Finalités</h2>
        <ul>
          <li>Suivi des commandes : retrouver les personnes intéressées et rapprocher leurs paiements.</li>
          <li>Réponse aux messages adressés au bureau.</li>
          <li>Accès sécurisé du bureau à l’administration du site.</li>
        </ul>
        <p>Vos données ne sont ni vendues, ni cédées, ni utilisées à des fins publicitaires.</p>

        <h2>Destinataires</h2>
        <p>
          Seuls les membres du bureau habilités accèdent à ces données, depuis un espace protégé. Les actions
          du bureau sont tracées dans un journal d’audit.
        </p>

        <h2>Cookies</h2>
        <p>
          Le site n’utilise un cookie que pour la connexion des membres du bureau ; il est strictement
          nécessaire et ne contient aucune donnée personnelle. Aucun outil de mesure d’audience ni aucun
          traceur tiers n’est utilisé : aucun consentement n’est donc requis.
        </p>

        <h2>Vos droits</h2>
        <p>
          Conformément au Règlement général sur la protection des données, vous disposez d’un droit d’accès,
          de rectification, d’effacement, de limitation et d’opposition. Pour exercer ces droits, contactez le
          bureau. Vous pouvez également adresser une réclamation à la CNIL (cnil.fr).
        </p>
      </Prose>
    </div>
  )
}
