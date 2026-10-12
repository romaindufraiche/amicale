import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/*
 * Modèle de données de l'Amicale.
 *
 * Conventions :
 * - montants en centimes d'euro (entiers), jamais en flottants ;
 * - horodatages en `timestamptz`.
 */

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

// ─── Comptes du bureau & accès ───────────────────────────────────────────────

/** Seuls les membres du bureau ont un compte : les adhérents n'en ont pas. */
export const userRole = pgEnum('user_role', ['BUREAU', 'ADMIN'])

export const userStatus = pgEnum('user_status', ['ACTIVE', 'SUSPENDED'])

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Toujours stocké en minuscules (voir `normalizeEmail`). */
    email: text().notNull(),
    passwordHash: text().notNull(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    role: userRole().notNull().default('BUREAU'),
    status: userStatus().notNull().default('ACTIVE'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    check('users_email_lowercase', sql`${t.email} = lower(${t.email})`),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    /** Empreinte SHA-256 du jeton : le jeton brut n'existe que dans le cookie. */
    id: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    userAgent: text(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId), index('sessions_expires_at_idx').on(t.expiresAt)],
)

export const tokenPurpose = pgEnum('token_purpose', ['PASSWORD_RESET'])

export const userTokens = pgTable(
  'user_tokens',
  {
    /** Empreinte SHA-256 du jeton envoyé par email (réinitialisation du mot de passe). */
    id: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: tokenPurpose().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('user_tokens_user_purpose_idx').on(t.userId, t.purpose)],
)

/** Compteurs de limitation de débit (connexion, commandes, contact…). */
export const rateLimits = pgTable('rate_limits', {
  key: text().primaryKey(),
  count: integer().notNull(),
  resetAt: timestamp({ withTimezone: true }).notNull(),
})

// ─── Médias ─────────────────────────────────────────────────────────────────

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
})

/**
 * Images téléversées par le bureau. Elles sont ré-encodées à l'envoi (WebP, 1600 px max,
 * métadonnées supprimées) et stockées en base : aucun fichier à gérer sur le serveur,
 * sauvegardées avec le reste des données.
 */
export const media = pgTable(
  'media',
  {
    id: uuid().primaryKey().defaultRandom(),
    mimeType: text().notNull(),
    data: bytea().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    sizeBytes: integer().notNull(),
    createdById: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('media_created_at_idx').on(t.createdAt),
    check('media_mime_type', sql`${t.mimeType} in ('image/webp')`),
  ],
)

/**
 * Fichiers joints par le bureau (PDF, ou photo JPEG ré-encodée sans métadonnées),
 * servis en téléchargement par `/media/fichiers/<id>`.
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid().primaryKey().defaultRandom(),
    mimeType: text().notNull(),
    /** Nom d'origine nettoyé, proposé au téléchargement. */
    fileName: text().notNull(),
    data: bytea().notNull(),
    sizeBytes: integer().notNull(),
    createdById: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('documents_created_at_idx').on(t.createdAt),
    check('documents_mime_type', sql`${t.mimeType} in ('application/pdf', 'image/jpeg')`),
  ],
)

// ─── Billetterie & sorties ───────────────────────────────────────────────────

export const offerKind = pgEnum('offer_kind', [
  /** Billet à utiliser librement jusqu'à une date de validité (cinéma, parc…). */
  'TICKET',
  /** Sortie ou événement organisé par l'Amicale, à date fixe. */
  'EVENT',
  /** Autre (réduction, bon d'achat, séjour…) : ni date de sortie ni validité imposées. */
  'OTHER',
])

export const offerCategory = pgEnum('offer_category', [
  'PARCS',
  'CINEMA',
  'VOYAGES',
  'SPORT',
  'EPICERIE',
  'PARFUMERIE',
  'AUTRE',
])

export const publicationStatus = pgEnum('publication_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])

export const offers = pgTable(
  'offers',
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull(),
    title: text().notNull(),
    kind: offerKind().notNull(),
    category: offerCategory().notNull(),
    /** Accroche facultative affichée sur la carte du catalogue. */
    summary: text(),
    description: text().notNull(),
    /** Site du prestataire, proposé sur la fiche de l'offre. */
    providerUrl: text(),
    /** Fichier joint (PDF ou JPEG) téléchargeable depuis la fiche. */
    attachmentId: uuid().references(() => documents.id, { onDelete: 'set null' }),
    /** Billets électroniques envoyés par email (mention standard sur la fiche). */
    eTickets: boolean().notNull().default(false),
    /** Précisions sur le retrait ou la remise des billets. */
    pickupInfo: text(),
    location: text(),
    eventStartsAt: timestamp({ withTimezone: true }),
    validUntil: date({ mode: 'string' }),
    /** Au-delà de cette date, les commandes sont fermées. */
    orderDeadline: timestamp({ withTimezone: true }),
    /** Visuel de l'offre ; à défaut, un visuel de catégorie est affiché. */
    imageId: uuid().references(() => media.id, { onDelete: 'set null' }),
    /** Mise en avant dans la rubrique « À la une ». */
    featured: boolean().notNull().default(false),
    /** Tarifs affichés sur le site public ; sinon visibles seulement sur la page de paiement. */
    pricesPublic: boolean().notNull().default(true),
    /** Bouton « Commander » ; désactivé pour une offre à réserver directement chez le prestataire. */
    orderable: boolean().notNull().default(true),
    /** Ordre d'affichage choisi par le bureau (les plus petits en premier). */
    position: integer().notNull().default(0),
    status: publicationStatus().notNull().default('DRAFT'),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('offers_slug_key').on(t.slug),
    index('offers_status_idx').on(t.status),
    check('offers_event_has_date', sql`${t.kind} <> 'EVENT' or ${t.eventStartsAt} is not null`),
  ],
)

export const offerTariffs = pgTable(
  'offer_tariffs',
  {
    id: uuid().primaryKey().defaultRandom(),
    offerId: uuid()
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    label: text().notNull(),
    memberPriceCents: integer().notNull(),
    /** Prix public de référence, pour indiquer l'économie réalisée. */
    publicPriceCents: integer(),
    /** Places ou billets restants ; `null` = sans limite de stock. */
    stock: integer(),
    position: integer().notNull().default(0),
    active: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index('offer_tariffs_offer_id_idx').on(t.offerId),
    check('offer_tariffs_member_price_positive', sql`${t.memberPriceCents} >= 0`),
    check(
      'offer_tariffs_public_price_positive',
      sql`${t.publicPriceCents} is null or ${t.publicPriceCents} >= 0`,
    ),
    check('offer_tariffs_stock_positive', sql`${t.stock} is null or ${t.stock} >= 0`),
  ],
)

/**
 * Commande passée depuis la fiche d'une offre (nom, prénom, email). Le bureau la suit dans
 * son espace et note le règlement une fois reçu.
 */
export const offerRequests = pgTable(
  'offer_requests',
  {
    id: uuid().primaryKey().defaultRandom(),
    offerId: uuid()
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull(),
    phone: text(),
    /** Nombre total de billets demandés. */
    quantity: integer().notNull().default(1),
    /** Détail par tarif, libellés copiés au moment de la commande. */
    lines: jsonb().$type<{ label: string; quantity: number }[]>().notNull().default([]),
    /** Règlement constaté par le bureau. */
    paidAt: timestamp({ withTimezone: true }),
    paidMarkedById: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('offer_requests_offer_id_idx').on(t.offerId),
    index('offer_requests_created_at_idx').on(t.createdAt),
    check('offer_requests_quantity_positive', sql`${t.quantity} > 0`),
  ],
)

// ─── Avantages partenaires ───────────────────────────────────────────────────

export const partners = pgTable(
  'partners',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    category: offerCategory().notNull(),
    /** Résumé facultatif de l'avantage, ex. « Tarif préférentiel sur l'abonnement annuel ». */
    advantage: text(),
    description: text(),
    /** Démarche pour bénéficier de l'avantage, affichée sur la page publique « Partenaires ». */
    howToBenefit: text(),
    websiteUrl: text(),
    imageId: uuid().references(() => media.id, { onDelete: 'set null' }),
    attachmentId: uuid().references(() => documents.id, { onDelete: 'set null' }),
    /** Ordre d'affichage choisi par le bureau (les plus petits en premier). */
    position: integer().notNull().default(0),
    published: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [index('partners_published_idx').on(t.published)],
)

// ─── Actualités ──────────────────────────────────────────────────────────────

export const news = pgTable(
  'news',
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull(),
    title: text().notNull(),
    excerpt: text().notNull(),
    body: text().notNull(),
    /** Photo d'illustration, affichée en tête de l'article et dans les listes. */
    imageId: uuid().references(() => media.id, { onDelete: 'set null' }),
    status: publicationStatus().notNull().default('DRAFT'),
    publishedAt: timestamp({ withTimezone: true }),
    authorId: uuid().references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('news_slug_key').on(t.slug),
    index('news_status_published_idx').on(t.status, t.publishedAt),
  ],
)

// ─── Posts « À la une » ─────────────────────────────────────────────────────

export const highlightTone = pgEnum('highlight_tone', ['RED', 'NIGHT', 'AMBER', 'BLUE', 'SAND'])

/** Messages courts publiés par le bureau, affichés dans le bandeau défilant « À la une ». */
export const highlights = pgTable(
  'highlights',
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    body: text().notNull(),
    /** Lien facultatif : chemin interne (/offres/…) ou adresse https. */
    linkUrl: text(),
    linkLabel: text(),
    tone: highlightTone().notNull().default('RED'),
    imageId: uuid().references(() => media.id, { onDelete: 'set null' }),
    published: boolean().notNull().default(false),
    /** Période d'affichage facultative. */
    startsAt: timestamp({ withTimezone: true }),
    endsAt: timestamp({ withTimezone: true }),
    position: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index('highlights_published_idx').on(t.published, t.position),
    check(
      'highlights_period',
      sql`${t.startsAt} is null or ${t.endsAt} is null or ${t.startsAt} < ${t.endsAt}`,
    ),
  ],
)

// ─── Contact ─────────────────────────────────────────────────────────────────

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull(),
    subject: text().notNull(),
    message: text().notNull(),
    handledAt: timestamp({ withTimezone: true }),
    handledById: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('contact_messages_created_at_idx').on(t.createdAt)],
)

// ─── Réglages du site ───────────────────────────────────────────────────────

/** Réglages modifiables depuis l'espace bureau ; une seule ligne (id = 1). */
export const siteSettings = pgTable(
  'site_settings',
  {
    id: integer().primaryKey().default(1),
    /** Page HelloAsso d'adhésion à l'Amicale (bouton « Adhérer »). */
    membershipUrl: text(),
    /** Adresse qui reçoit un email à chaque commande ; à défaut, `BUREAU_EMAIL`. */
    ordersEmail: text(),
    updatedById: uuid().references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check('site_settings_single_row', sql`${t.id} = 1`)],
)

// ─── Journal d'audit ─────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid().primaryKey().defaultRandom(),
    actorId: uuid().references(() => users.id, { onDelete: 'set null' }),
    action: text().notNull(),
    entityType: text().notNull(),
    entityId: text(),
    /** Contexte non sensible de l'action (jamais de mot de passe ni de jeton). */
    details: jsonb().$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_created_at_idx').on(t.createdAt),
    index('audit_logs_entity_idx').on(t.entityType, t.entityId),
  ],
)

export type User = typeof users.$inferSelect
export type UserRole = (typeof userRole.enumValues)[number]
export type UserStatus = (typeof userStatus.enumValues)[number]
export type Offer = typeof offers.$inferSelect
export type OfferTariff = typeof offerTariffs.$inferSelect
export type OfferKind = (typeof offerKind.enumValues)[number]
export type OfferCategory = (typeof offerCategory.enumValues)[number]
export type PublicationStatus = (typeof publicationStatus.enumValues)[number]
export type OfferRequest = typeof offerRequests.$inferSelect
export type SiteSettings = typeof siteSettings.$inferSelect
export type Partner = typeof partners.$inferSelect
export type News = typeof news.$inferSelect
export type Highlight = typeof highlights.$inferSelect
export type HighlightTone = (typeof highlightTone.enumValues)[number]
export type Media = typeof media.$inferSelect
export type DocumentFile = typeof documents.$inferSelect
export type ContactMessage = typeof contactMessages.$inferSelect
