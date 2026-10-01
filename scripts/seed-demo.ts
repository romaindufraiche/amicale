/**
 * Données de DÉMONSTRATION pour le développement local, les présentations et les captures.
 * Refuse de s'exécuter en production (sauf site de démonstration, DEMO_MODE=true) ou sur une
 * base contenant de vrais comptes. Option --if-empty : ne fait rien si la base contient déjà des comptes.
 *
 * Tout est fictif : offres, prix, lieux, partenaires et actualités. Aucune enseigne réelle
 * n'est citée, pour ne laisser croire à aucun partenariat existant. Chaque description
 * le signale explicitement.
 *
 *   pnpm db:seed:demo
 */
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { changeOrderStatus, createOrder } from '@/features/orders/service'
import { hashPassword } from '@/server/auth/password'
import { db } from '@/server/db/client'
import {
  contactMessages,
  highlights,
  news,
  offers,
  offerTariffs,
  partners,
  users,
  type OfferCategory,
} from '@/server/db/schema'

const DEMO = 'Offre fictive de démonstration : lieu, dates et tarifs sont inventés.'
const DEMO_PASSWORD = 'demo-mot-de-passe'

function inDays(days: number, hour = 10, minute = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

function isoDay(days: number): string {
  return inDays(days).toISOString().slice(0, 10)
}

type DemoTariff = { label: string; member: number; public?: number; stock?: number }
type DemoOffer = {
  slug: string
  title: string
  kind: 'TICKET' | 'EVENT'
  category: OfferCategory
  summary: string
  description: string
  featured?: boolean
  /** `false` : tarifs réservés aux adhérents connectés. */
  pricesPublic?: boolean
  location?: string
  eventInDays?: number
  eventHour?: number
  validForDays?: number
  closesInDays?: number
  maxPerMember?: number
  pickupInfo?: string
  tariffs: DemoTariff[]
}

const E_TICKETS = 'E-billets envoyés par email sous 48 h après réception du règlement.'

const DEMO_OFFERS: DemoOffer[] = [
  {
    slug: 'arbre-de-noel-amicale',
    title: 'Arbre de Noël de l’Amicale',
    kind: 'EVENT',
    category: 'FAMILLE',
    featured: true,
    summary: 'Spectacle, goûter et distribution de cadeaux pour les enfants des adhérents.',
    description: `${DEMO}\n\nL’après-midi réunit les familles autour d’un spectacle de magie, d’un goûter et de la visite du Père Noël.\n\nInscription obligatoire pour chaque enfant afin de préparer les cadeaux.`,
    location: 'Salle des fêtes (démo), Cergy',
    eventInDays: 75,
    eventHour: 14,
    closesInDays: 50,
    maxPerMember: 6,
    pickupInfo: 'Accueil sur place sur présentation de votre numéro d’adhérent.',
    tariffs: [
      { label: 'Enfant (jusqu’à 12 ans)', member: 0, stock: 120 },
      { label: 'Adulte accompagnant', member: 500, stock: 150 },
    ],
  },
  {
    slug: 'grand-parc-attractions',
    title: 'Grand parc d’attractions',
    kind: 'TICKET',
    category: 'PARCS',
    featured: true,
    summary: 'Billet daté 1 jour, accès à toutes les attractions et spectacles du parc.',
    description: `${DEMO}\n\nPlus de 40 attractions pour petits et grands, spectacles en continu et parades en fin de journée.`,
    validForDays: 240,
    maxPerMember: 8,
    pickupInfo: E_TICKETS,
    tariffs: [
      { label: 'Adulte', member: 3900, public: 6200, stock: 8 },
      { label: 'Enfant (3 à 11 ans)', member: 3200, public: 5500, stock: 8 },
    ],
  },
  {
    slug: 'match-football-premiere-division',
    title: 'Match de football — première division',
    kind: 'EVENT',
    category: 'SPORT',
    featured: true,
    summary: 'Places en tribune latérale pour un match de championnat au stade.',
    description: `${DEMO}\n\nPlaces regroupées pour les adhérents. Ouverture des portes deux heures avant le coup d’envoi.`,
    location: 'Stade (démo), Saint-Denis',
    eventInDays: 32,
    eventHour: 21,
    closesInDays: 20,
    maxPerMember: 4,
    pickupInfo: E_TICKETS,
    tariffs: [{ label: 'Tribune latérale', member: 2500, public: 4500, stock: 40 }],
  },
  {
    slug: 'cinema-e-billet',
    title: 'Cinéma — e-billet toutes séances',
    kind: 'TICKET',
    category: 'CINEMA',
    summary: 'Valable pour toutes les séances 2D, 7 jours sur 7, dans le réseau partenaire.',
    description: `${DEMO}\n\nLe e-billet s’échange directement en caisse ou sur la borne contre une place pour la séance de votre choix.`,
    validForDays: 300,
    maxPerMember: 20,
    pickupInfo: E_TICKETS,
    tariffs: [{ label: 'Place de cinéma', member: 750, public: 1350 }],
  },
  {
    slug: 'cinema-salle-premium',
    title: 'Cinéma — séance en salle premium',
    kind: 'TICKET',
    category: 'CINEMA',
    summary: 'Grand écran, son immersif et fauteuils inclinables.',
    description: `${DEMO}\n\nSupplément lunettes 3D éventuel à régler sur place.`,
    validForDays: 180,
    maxPerMember: 10,
    pickupInfo: E_TICKETS,
    tariffs: [{ label: 'Place premium', member: 1190, public: 1950 }],
  },
  {
    slug: 'parc-animalier',
    title: 'Parc animalier et safari',
    kind: 'TICKET',
    category: 'PARCS',
    summary: 'Parcours à pied et en voiture au milieu de plus de 1 000 animaux.',
    description: `${DEMO}\n\nPrévoyez une journée complète : le safari en voiture dure environ deux heures.`,
    validForDays: 200,
    pickupInfo: E_TICKETS,
    tariffs: [
      { label: 'Adulte', member: 2400, public: 3600 },
      { label: 'Enfant (3 à 12 ans)', member: 1900, public: 2900 },
    ],
  },
  {
    slug: 'aquarium',
    title: 'Aquarium et tunnel des requins',
    kind: 'TICKET',
    category: 'FAMILLE',
    summary: 'Découverte des fonds marins, bassin tactile et nourrissages commentés.',
    description: `${DEMO}\n\nAccessible aux poussettes et aux personnes à mobilité réduite.`,
    validForDays: 150,
    pickupInfo: E_TICKETS,
    tariffs: [
      { label: 'Adulte', member: 1600, public: 2400 },
      { label: 'Enfant (3 à 12 ans)', member: 1100, public: 1700 },
    ],
  },
  {
    slug: 'concert-musiques-de-films',
    title: 'Concert symphonique « Musiques de films »',
    kind: 'EVENT',
    category: 'SPECTACLES',
    summary: 'Un grand orchestre interprète les bandes originales les plus célèbres.',
    description: `${DEMO}\n\nPlacement en catégorie 1, places côte à côte selon l’ordre des commandes.`,
    location: 'Salle de concert (démo), Paris',
    eventInDays: 46,
    eventHour: 20,
    closesInDays: 30,
    maxPerMember: 4,
    pickupInfo: E_TICKETS,
    tariffs: [{ label: 'Catégorie 1', member: 3500, public: 5900, stock: 30 }],
  },
  {
    slug: 'comedie-musicale',
    title: 'Comédie musicale à grand spectacle',
    kind: 'EVENT',
    category: 'SPECTACLES',
    summary: 'Le spectacle familial de la saison, décors et costumes spectaculaires.',
    description: `${DEMO}\n\nDurée 2 h 15 avec entracte. Conseillé à partir de 6 ans.`,
    location: 'Théâtre (démo), Paris',
    eventInDays: 60,
    eventHour: 15,
    closesInDays: 40,
    maxPerMember: 6,
    pickupInfo: E_TICKETS,
    tariffs: [
      { label: 'Adulte', member: 4200, public: 6900, stock: 25 },
      { label: 'Enfant (moins de 12 ans)', member: 3000, public: 4900, stock: 25 },
    ],
  },
  {
    slug: 'soiree-cabaret',
    title: 'Soirée cabaret avec dîner',
    kind: 'EVENT',
    category: 'SPECTACLES',
    pricesPublic: false,
    summary: 'Dîner-spectacle dans un cabaret de la région, boissons comprises.',
    description: `${DEMO}\n\nExemple d’offre complète : toutes les places ont été réservées.`,
    location: 'Cabaret (démo), Val d’Oise',
    eventInDays: 25,
    eventHour: 19,
    tariffs: [{ label: 'Dîner et spectacle', member: 5900, public: 8900, stock: 0 }],
  },
  {
    slug: 'bowling-laser-game',
    title: 'Sortie bowling et laser game',
    kind: 'EVENT',
    category: 'FAMILLE',
    summary: 'Deux parties de bowling, une partie de laser game et un goûter.',
    description: `${DEMO}\n\nSortie encadrée par des membres du bureau, ouverte aux familles.`,
    location: 'Complexe de loisirs (démo), Osny',
    eventInDays: 18,
    eventHour: 14,
    closesInDays: 12,
    maxPerMember: 5,
    pickupInfo: 'Rendez-vous sur place, liste des inscrits tenue par le bureau.',
    tariffs: [
      { label: 'Adulte', member: 1200, public: 2400, stock: 30 },
      { label: 'Enfant', member: 800, public: 1800, stock: 30 },
    ],
  },
  {
    slug: 'escalade-carte-10-entrees',
    title: 'Salle d’escalade — carte 10 entrées',
    kind: 'TICKET',
    category: 'SPORT',
    summary: 'Accès libre aux murs de bloc et de voies, location de chaussons comprise.',
    description: `${DEMO}\n\nCarte nominative, valable un an à partir de la première utilisation.`,
    validForDays: 365,
    maxPerMember: 2,
    pickupInfo: 'Carte remise lors de la permanence du bureau (démo).',
    tariffs: [{ label: 'Carte 10 entrées', member: 9000, public: 14000 }],
  },
  {
    slug: 'journee-peche-etang',
    title: 'Journée pêche en étang privé',
    kind: 'EVENT',
    category: 'SPORT',
    summary: 'Pêche à la carpe et à la truite, déjeuner champêtre compris.',
    description: `${DEMO}\n\nMatériel non fourni. Carte de pêche non nécessaire (étang privé).`,
    location: 'Étang (démo), Vexin',
    eventInDays: 40,
    eventHour: 7,
    closesInDays: 30,
    maxPerMember: 3,
    tariffs: [{ label: 'Participant', member: 1500, stock: 24 }],
  },
  {
    slug: 'week-end-mer-normandie',
    title: 'Week-end à la mer en Normandie',
    kind: 'EVENT',
    category: 'VOYAGES',
    summary: 'Deux jours en demi-pension, transport en autocar au départ de Cergy.',
    description: `${DEMO}\n\nHébergement en chambre double, visite guidée et temps libre en bord de mer.`,
    location: 'Côte normande (démo)',
    eventInDays: 95,
    eventHour: 7,
    closesInDays: 60,
    maxPerMember: 4,
    pickupInfo: 'Programme détaillé et convocation envoyés par email aux inscrits.',
    tariffs: [
      { label: 'Adulte (chambre double)', member: 11900, public: 18900, stock: 20 },
      { label: 'Enfant (moins de 12 ans)', member: 7900, public: 12900, stock: 10 },
    ],
  },
  {
    slug: 'sejour-ski-alpes',
    title: 'Séjour ski dans les Alpes',
    kind: 'EVENT',
    category: 'VOYAGES',
    summary: 'Une semaine en résidence au pied des pistes, forfait 6 jours inclus.',
    description: `${DEMO}\n\nLe tarif correspond à l’acompte ; le solde est réglé un mois avant le départ.`,
    location: 'Station de ski (démo), Savoie',
    eventInDays: 130,
    eventHour: 8,
    closesInDays: 70,
    maxPerMember: 5,
    tariffs: [{ label: 'Acompte par personne', member: 15000, stock: 25 }],
  },
  {
    slug: 'thermes-et-spa',
    title: 'Thermes et spa — accès 3 heures',
    kind: 'TICKET',
    category: 'AUTRE',
    summary: 'Bassins, hammam, sauna et espace détente.',
    description: `${DEMO}\n\nRéservation du créneau auprès de l’établissement avec le code du billet.`,
    validForDays: 270,
    pickupInfo: E_TICKETS,
    tariffs: [{ label: 'Entrée 3 heures', member: 2200, public: 3500 }],
  },
  {
    slug: 'musee-exposition-temporaire',
    title: 'Exposition temporaire au musée',
    kind: 'TICKET',
    category: 'SPECTACLES',
    summary: 'Billet coupe-file pour l’exposition événement de l’automne.',
    description: `${DEMO}\n\nAudioguide disponible sur place.`,
    validForDays: 90,
    pickupInfo: E_TICKETS,
    tariffs: [{ label: 'Entrée coupe-file', member: 1200, public: 1900 }],
  },
]

const DEMO_PARTNERS: (typeof partners.$inferInsert)[] = [
  {
    name: 'Salle de sport (démo)',
    category: 'SPORT',
    advantage: 'Frais d’inscription offerts et −20 % sur l’abonnement annuel',
    description: 'Partenaire fictif de démonstration.',
    howToBenefit: 'Présentez votre numéro d’adhérent à l’accueil.',
    published: true,
  },
  {
    name: 'Agence de voyages (démo)',
    category: 'VOYAGES',
    advantage: '−8 % sur les séjours et circuits du catalogue',
    description: 'Partenaire fictif de démonstration.',
    howToBenefit: 'Code : DEMO-VOYAGE (fictif), à indiquer lors de la réservation.',
    published: true,
  },
  {
    name: 'Garage automobile (démo)',
    category: 'AUTRE',
    advantage: '−15 % sur l’entretien et les pneumatiques',
    description: 'Partenaire fictif de démonstration.',
    howToBenefit: 'Mentionnez l’Amicale lors de la prise de rendez-vous.',
    published: true,
  },
  {
    name: 'Librairie (démo)',
    category: 'SPECTACLES',
    advantage: '5 % de remise sur les livres et −10 % sur la papeterie',
    description: 'Partenaire fictif de démonstration.',
    howToBenefit: 'Carte d’adhérent ou numéro d’adhérent en caisse.',
    published: true,
  },
  {
    name: 'Centre de loisirs pour enfants (démo)',
    category: 'FAMILLE',
    advantage: 'Une entrée enfant offerte pour une entrée achetée',
    description: 'Partenaire fictif de démonstration.',
    howToBenefit: 'Code : DEMO-KIDS (fictif).',
    published: true,
  },
]

async function main() {
  // Autorisé en production uniquement sur un site de démonstration déclaré (DEMO_MODE=true).
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true') {
    throw new Error('Le jeu de démonstration est interdit en production (hors DEMO_MODE=true).')
  }
  // --if-empty : utilisé au démarrage d'un site de démonstration, ne fait rien si la base contient déjà des comptes.
  if (process.argv.includes('--if-empty')) {
    const [existing] = await db.execute<{ count: number }>(sql`select count(*)::int as count from users`)
    if (existing && existing.count > 0) {
      console.log('Base déjà initialisée : données de démonstration conservées.')
      return
    }
  }
  // Garde-fou : la base est vidée. On refuse si elle contient un vrai compte.
  const [real] = await db.execute<{ count: number }>(
    sql`select count(*)::int as count from users where email not like '%@demo.local'`,
  )
  if (real && real.count > 0) {
    throw new Error('La base contient des comptes réels : réinitialisation de démonstration refusée.')
  }

  await db.execute(
    sql`truncate audit_logs, contact_messages, highlights, media, news, partners, order_lines, orders, offer_tariffs, offers, user_tokens, sessions, rate_limits, users restart identity cascade`,
  )

  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const year = new Date().getFullYear()
  const [bureau, member] = await db
    .insert(users)
    .values([
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
      {
        email: 'retraite@demo.local',
        passwordHash,
        firstName: 'Dominique',
        lastName: 'Illustration',
        category: 'RETRAITE',
        status: 'PENDING_APPROVAL',
        emailVerifiedAt: new Date(),
      },
    ])
    .returning({ id: users.id })
  if (!bureau || !member) throw new Error('Comptes de démonstration non créés')
  await db.execute(sql`alter sequence member_number_seq restart with 3`)

  const created = new Map<string, { offerId: string; tariffIds: string[] }>()
  for (const [index, offer] of DEMO_OFFERS.entries()) {
    const [row] = await db
      .insert(offers)
      .values({
        slug: offer.slug,
        title: offer.title,
        kind: offer.kind,
        category: offer.category,
        summary: offer.summary,
        description: offer.description,
        featured: offer.featured ?? false,
        pricesPublic: offer.pricesPublic ?? true,
        location: offer.location,
        eventStartsAt: offer.eventInDays !== undefined ? inDays(offer.eventInDays, offer.eventHour) : null,
        validUntil: offer.validForDays !== undefined ? isoDay(offer.validForDays) : null,
        orderDeadline: offer.closesInDays !== undefined ? inDays(offer.closesInDays, 23, 59) : null,
        maxPerMember: offer.maxPerMember,
        pickupInfo: offer.pickupInfo,
        status: 'PUBLISHED',
        // Dates de publication échelonnées pour que le tri « Nouveautés » ait un sens.
        publishedAt: inDays(-index),
      })
      .returning({ id: offers.id })
    if (!row) throw new Error(`Offre non créée : ${offer.slug}`)
    const tariffs = await db
      .insert(offerTariffs)
      .values(
        offer.tariffs.map((tariff, position) => ({
          offerId: row.id,
          label: tariff.label,
          memberPriceCents: tariff.member,
          publicPriceCents: tariff.public ?? null,
          stock: tariff.stock ?? null,
          position,
        })),
      )
      .returning({ id: offerTariffs.id })
    created.set(offer.slug, { offerId: row.id, tariffIds: tariffs.map((tariff) => tariff.id) })
  }

  // Quelques commandes de l'adhérent de démonstration, passées par le vrai service métier.
  async function order(slug: string, quantities: number[]) {
    const target = created.get(slug)
    if (!target) throw new Error(`Offre inconnue : ${slug}`)
    const { orderId } = await createOrder({
      userId: member!.id,
      offerId: target.offerId,
      idempotencyKey: randomUUID(),
      lines: target.tariffIds.map((tariffId, i) => ({ tariffId, quantity: quantities[i] ?? 0 })),
    })
    return orderId
  }
  const cinema = await order('cinema-e-billet', [4])
  await changeOrderStatus(bureau.id, cinema, 'PAID')
  await changeOrderStatus(bureau.id, cinema, 'DELIVERED')
  const christmas = await order('arbre-de-noel-amicale', [2, 2])
  await changeOrderStatus(bureau.id, christmas, 'PAID')
  await order('match-football-premiere-division', [2])

  await db.insert(partners).values(DEMO_PARTNERS)

  await db.insert(news).values([
    {
      slug: 'nouveau-site-amicale',
      title: 'Bienvenue sur le nouveau site de l’Amicale',
      excerpt:
        'Billetterie, sorties, avantages partenaires : tout se passe désormais en ligne, depuis votre espace adhérent.',
      body: 'Actualité fictive de démonstration.\n\nLe nouveau site permet de commander vos billets à tarif adhérent, de vous inscrire aux sorties et de suivre vos commandes.\n\nPour y accéder, créez votre compte : le bureau validera votre adhésion.',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: inDays(-1),
      authorId: bureau.id,
    },
    {
      slug: 'inscriptions-arbre-de-noel',
      title: 'Arbre de Noël : les inscriptions sont ouvertes',
      excerpt:
        'Spectacle, goûter et cadeaux pour les enfants des adhérents : pensez à inscrire chaque enfant avant la date limite.',
      body: 'Actualité fictive de démonstration.\n\nLes inscriptions se font depuis la billetterie de votre espace adhérent, rubrique « Famille & enfants ».',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: inDays(-4),
      authorId: bureau.id,
    },
    {
      slug: 'assemblee-generale',
      title: 'Assemblée générale annuelle',
      excerpt:
        'Ordre du jour, rapport moral et financier : les documents sont disponibles pour les adhérents.',
      body: 'Actualité fictive de démonstration, réservée aux adhérents.\n\nL’assemblée générale est l’occasion de faire le bilan de l’année et d’élire le bureau.',
      visibility: 'MEMBERS',
      status: 'PUBLISHED',
      publishedAt: inDays(-9),
      authorId: bureau.id,
    },
    {
      slug: 'nouveaux-partenaires',
      title: 'Trois nouveaux partenaires rejoignent l’Amicale',
      excerpt:
        'Sport, voyages et entretien automobile : de nouvelles réductions permanentes pour les adhérents.',
      body: 'Actualité fictive de démonstration.\n\nRetrouvez toutes les conditions dans la rubrique « Avantages partenaires » de votre espace.',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: inDays(-15),
      authorId: bureau.id,
    },
  ])

  await db.insert(highlights).values([
    {
      title: 'Arbre de Noël : inscrivez vos enfants',
      body: 'Spectacle, goûter et cadeaux : les inscriptions sont ouvertes dans la billetterie. (Post de démonstration.)',
      linkUrl: '/espace/billetterie/arbre-de-noel-amicale',
      linkLabel: 'Je m’inscris',
      tone: 'RED',
      published: true,
      position: 1,
    },
    {
      title: 'Grand parc : jusqu’à −41 %',
      body: 'Billets adulte et enfant à tarif adhérent, dans la limite des stocks disponibles. (Post de démonstration.)',
      linkUrl: '/espace/billetterie/grand-parc-attractions',
      linkLabel: 'Voir l’offre',
      tone: 'AMBER',
      published: true,
      position: 2,
    },
    {
      title: 'Permanence du bureau',
      body: 'Le bureau vous accueille chaque premier mardi du mois pour vos questions et le retrait des billets. (Post de démonstration.)',
      linkUrl: '/contact',
      linkLabel: 'Nous contacter',
      tone: 'NIGHT',
      published: true,
      position: 3,
    },
    {
      title: 'Match de football : 40 places',
      body: 'Places en tribune latérale regroupées pour les adhérents. (Post de démonstration.)',
      linkUrl: '/espace/billetterie/match-football-premiere-division',
      linkLabel: 'Réserver',
      tone: 'BLUE',
      published: true,
      position: 4,
    },
    {
      title: 'Assemblée générale',
      body: 'Les documents de l’assemblée générale sont disponibles pour les adhérents. (Post de démonstration.)',
      linkUrl: '/actualites/assemblee-generale',
      linkLabel: 'Lire',
      tone: 'SAND',
      visibility: 'MEMBERS',
      published: true,
      position: 5,
    },
  ])

  await db.insert(contactMessages).values({
    name: 'Visiteur démo',
    email: 'visiteur@demo.local',
    subject: 'Adhésion',
    message: 'Message fictif de démonstration : bonjour, je suis retraité, puis-je adhérer à l’Amicale ?',
  })

  console.log(
    `Données de démonstration créées : ${DEMO_OFFERS.length} offres, ${DEMO_PARTNERS.length} partenaires, 4 actualités, 5 posts à la une.`,
  )
  console.log(
    `Comptes (mot de passe « ${DEMO_PASSWORD} ») : bureau@demo.local, adherent@demo.local, demande@demo.local, retraite@demo.local`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
