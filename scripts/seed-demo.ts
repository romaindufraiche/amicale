/**
 * Données de DÉMONSTRATION pour le développement local et les captures d'écran.
 * Refuse de s'exécuter en production. Aucune de ces données n'est réelle : offres,
 * prix et partenaires sont fictifs et signalés comme tels dans leurs textes.
 *
 *   pnpm db:seed:demo
 */
import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { hashPassword } from '@/server/auth/password'
import { db } from '@/server/db/client'
import { news, offers, offerTariffs, partners, users } from '@/server/db/schema'

const DEMO_NOTE = 'Contenu de démonstration, à remplacer par les informations réelles du bureau.'
const DEMO_PASSWORD = 'demo-mot-de-passe'

function inDays(days: number, hour = 10): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date
}

function isoDay(days: number): string {
  return inDays(days).toISOString().slice(0, 10)
}

async function main() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Le jeu de démonstration est interdit en production.')
  // Garde-fou : la base est vidée. On refuse si elle contient un vrai compte.
  const [real] = await db.execute<{ count: number }>(
    sql`select count(*)::int as count from users where email not like '%@demo.local'`,
  )
  if (real && real.count > 0)
    throw new Error('La base contient des comptes réels : réinitialisation de démonstration refusée.')

  await db.execute(
    sql`truncate audit_logs, contact_messages, news, partners, order_lines, orders, offer_tariffs, offers, user_tokens, sessions, rate_limits, users restart identity cascade`,
  )
  await db.execute(sql`alter sequence member_number_seq restart with 1`)

  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const year = new Date().getFullYear()
  await db.insert(users).values([
    {
      email: 'bureau@demo.local',
      passwordHash,
      firstName: 'Camille',
      lastName: 'Démo',
      category: 'ACTIF',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      memberNumber: `95-${year}-0001`,
      membershipValidUntil: `${year}-12-31`,
    },
    {
      email: 'adherent@demo.local',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Exemple',
      category: 'ACTIF',
      assignment: 'Service de démonstration',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      memberNumber: `95-${year}-0002`,
      membershipValidUntil: `${year}-12-31`,
    },
    {
      email: 'demande@demo.local',
      passwordHash,
      firstName: 'Sam',
      lastName: 'Candidat',
      category: 'RETRAITE',
      status: 'PENDING_APPROVAL',
      emailVerifiedAt: new Date(),
    },
  ])
  await db.execute(sql`alter sequence member_number_seq restart with 3`)

  const [event, cinema, park] = await db
    .insert(offers)
    .values([
      {
        slug: 'sortie-demo-journee-famille',
        title: 'Journée en famille (démo)',
        kind: 'EVENT',
        category: 'FAMILLE',
        summary:
          'Exemple de sortie organisée par l’Amicale, avec places limitées et clôture des inscriptions.',
        description: `${DEMO_NOTE}\n\nUne sortie se présente ici : programme, horaires, conditions de participation.`,
        location: 'Lieu de démonstration',
        eventStartsAt: inDays(40, 9),
        orderDeadline: inDays(25, 23),
        maxPerMember: 6,
        pickupInfo: 'Rendez-vous communiqué par email aux inscrits (démo).',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        slug: 'cinema-demo-e-billets',
        title: 'Cinéma — e-billets (démo)',
        kind: 'TICKET',
        category: 'CINEMA',
        summary: 'Exemple d’offre de billetterie : billets valables jusqu’à une date donnée.',
        description: DEMO_NOTE,
        validUntil: isoDay(300),
        maxPerMember: 10,
        pickupInfo: 'E-billets envoyés par email après règlement (démo).',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        slug: 'parc-de-loisirs-demo',
        title: 'Parc de loisirs (démo)',
        kind: 'TICKET',
        category: 'PARCS',
        summary: 'Exemple d’offre avec tarifs adulte et enfant, et stock limité.',
        description: DEMO_NOTE,
        validUntil: isoDay(200),
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    ])
    .returning({ id: offers.id })
  if (!event || !cinema || !park) throw new Error('Offres de démonstration non créées')

  await db.insert(offerTariffs).values([
    {
      offerId: event.id,
      label: 'Adulte',
      memberPriceCents: 2500,
      publicPriceCents: 4500,
      stock: 40,
      position: 0,
    },
    {
      offerId: event.id,
      label: 'Enfant (moins de 12 ans)',
      memberPriceCents: 1500,
      publicPriceCents: 3000,
      stock: 30,
      position: 1,
    },
    {
      offerId: cinema.id,
      label: 'Place de cinéma',
      memberPriceCents: 750,
      publicPriceCents: 1300,
      stock: null,
      position: 0,
    },
    {
      offerId: park.id,
      label: 'Adulte',
      memberPriceCents: 3900,
      publicPriceCents: 6200,
      stock: 8,
      position: 0,
    },
    {
      offerId: park.id,
      label: 'Enfant',
      memberPriceCents: 3200,
      publicPriceCents: 5500,
      stock: 8,
      position: 1,
    },
  ])

  await db.insert(partners).values([
    {
      name: 'Partenaire démo — Sport',
      category: 'SPORT',
      advantage: 'Exemple d’avantage négocié sur un abonnement',
      description: DEMO_NOTE,
      howToBenefit: 'Présentez votre numéro d’adhérent à l’accueil (démo).',
      published: true,
    },
    {
      name: 'Partenaire démo — Culture',
      category: 'SPECTACLES',
      advantage: 'Exemple de code de réduction',
      howToBenefit: 'Code : DEMO-CODE (fictif).',
      published: true,
    },
  ])

  await db.insert(news).values([
    {
      slug: 'actualite-demo-bienvenue',
      title: 'Bienvenue sur le nouveau site (démo)',
      excerpt: 'Exemple d’actualité publique, affichée sur l’accueil et dans la rubrique Actualités.',
      body: `${DEMO_NOTE}\n\nLes actualités sont rédigées par le bureau depuis l’espace dédié.`,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      slug: 'actualite-demo-adherents',
      title: 'Information réservée aux adhérents (démo)',
      excerpt: 'Exemple d’actualité dont la lecture est réservée aux adhérents connectés.',
      body: DEMO_NOTE,
      visibility: 'MEMBERS',
      status: 'PUBLISHED',
      publishedAt: inDays(-3),
    },
  ])

  console.log('Données de démonstration créées.')
  console.log(
    `Comptes (mot de passe « ${DEMO_PASSWORD} ») : bureau@demo.local, adherent@demo.local, demande@demo.local`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
