import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
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
 * - horodatages en `timestamptz` ;
 * - les libellés et prix des commandes sont copiés au moment de la commande
 *   (une modification ultérieure du tarif ne réécrit pas l'historique).
 */

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

// ─── Adhérents & accès ───────────────────────────────────────────────────────

export const userRole = pgEnum('user_role', ['MEMBER', 'BUREAU', 'ADMIN'])

export const userStatus = pgEnum('user_status', [
  /** Compte créé, adresse email non confirmée. */
  'PENDING_VERIFICATION',
  /** Email confirmé, demande d'adhésion en attente d'examen par le bureau. */
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
])

export const memberCategory = pgEnum('member_category', ['ACTIF', 'RETRAITE', 'ADMINISTRATIF', 'AUTRE'])

/** Compteur des numéros d'adhérent, attribués à la validation de l'adhésion. */
export const memberNumberSeq = pgSequence('member_number_seq', { startWith: 1 })

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Toujours stocké en minuscules (voir `normalizeEmail`). */
    email: text().notNull(),
    passwordHash: text().notNull(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    phone: text(),
    category: memberCategory().notNull(),
    /** Service d'affectation déclaré, utilisé par le bureau pour vérifier l'éligibilité. */
    assignment: text(),
    role: userRole().notNull().default('MEMBER'),
    status: userStatus().notNull().default('PENDING_VERIFICATION'),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    memberNumber: text(),
    /** Date de fin de validité de la cotisation (incluse). */
    membershipValidUntil: date({ mode: 'string' }),
    reviewedAt: timestamp({ withTimezone: true }),
    reviewedById: uuid().references((): AnyPgColumn => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    uniqueIndex('users_member_number_key').on(t.memberNumber),
    index('users_status_idx').on(t.status),
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

export const tokenPurpose = pgEnum('token_purpose', ['EMAIL_VERIFICATION', 'PASSWORD_RESET'])

export const userTokens = pgTable(
  'user_tokens',
  {
    /** Empreinte SHA-256 du jeton envoyé par email. */
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

/** Compteurs de limitation de débit (connexion, inscription, contact…). */
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

// ─── Billetterie & sorties ───────────────────────────────────────────────────

export const offerKind = pgEnum('offer_kind', [
  /** Billet à utiliser librement jusqu'à une date de validité (cinéma, parc…). */
  'TICKET',
  /** Sortie ou événement organisé par l'Amicale, à date fixe. */
  'EVENT',
])

export const offerCategory = pgEnum('offer_category', [
  'CINEMA',
  'PARCS',
  'SPECTACLES',
  'SPORT',
  'VOYAGES',
  'FAMILLE',
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
    summary: text().notNull(),
    description: text().notNull(),
    /** Modalités de retrait ou de remise des billets. */
    pickupInfo: text(),
    location: text(),
    eventStartsAt: timestamp({ withTimezone: true }),
    validUntil: date({ mode: 'string' }),
    /** Au-delà de cette date, les commandes sont fermées. */
    orderDeadline: timestamp({ withTimezone: true }),
    /** Quantité totale maximale par adhérent pour cette offre, tous tarifs confondus. */
    maxPerMember: integer(),
    /** Visuel de l'offre ; à défaut, un visuel de catégorie est affiché. */
    imageId: uuid().references(() => media.id, { onDelete: 'set null' }),
    /** Mise en avant dans la rubrique « À la une ». */
    featured: boolean().notNull().default(false),
    status: publicationStatus().notNull().default('DRAFT'),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('offers_slug_key').on(t.slug),
    index('offers_status_idx').on(t.status),
    check('offers_max_per_member_positive', sql`${t.maxPerMember} is null or ${t.maxPerMember} > 0`),
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

export const orderStatus = pgEnum('order_status', ['PENDING_PAYMENT', 'PAID', 'DELIVERED', 'CANCELLED'])

export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Numéro séquentiel lisible, affiché sous forme de référence (ex. C-000042). */
    number: integer().generatedAlwaysAsIdentity(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    offerId: uuid()
      .notNull()
      .references(() => offers.id, { onDelete: 'restrict' }),
    status: orderStatus().notNull().default('PENDING_PAYMENT'),
    totalCents: integer().notNull(),
    /** Clé fournie par le formulaire : une double soumission ne crée pas deux commandes. */
    idempotencyKey: text().notNull(),
    paidAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('orders_number_key').on(t.number),
    uniqueIndex('orders_user_idempotency_key').on(t.userId, t.idempotencyKey),
    index('orders_user_id_idx').on(t.userId),
    index('orders_offer_id_idx').on(t.offerId),
    index('orders_status_idx').on(t.status),
    check('orders_total_positive', sql`${t.totalCents} >= 0`),
  ],
)

export const orderLines = pgTable(
  'order_lines',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    tariffId: uuid()
      .notNull()
      .references(() => offerTariffs.id, { onDelete: 'restrict' }),
    label: text().notNull(),
    unitPriceCents: integer().notNull(),
    quantity: integer().notNull(),
  },
  (t) => [
    index('order_lines_order_id_idx').on(t.orderId),
    index('order_lines_tariff_id_idx').on(t.tariffId),
    check('order_lines_quantity_positive', sql`${t.quantity} > 0`),
    check('order_lines_unit_price_positive', sql`${t.unitPriceCents} >= 0`),
  ],
)

// ─── Avantages partenaires ───────────────────────────────────────────────────

export const partners = pgTable(
  'partners',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    category: offerCategory().notNull(),
    /** Résumé de l'avantage, ex. « Tarif préférentiel sur l'abonnement annuel ». */
    advantage: text().notNull(),
    description: text(),
    /** Code ou démarche, visible uniquement des adhérents à jour. */
    howToBenefit: text().notNull(),
    websiteUrl: text(),
    published: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [index('partners_published_idx').on(t.published)],
)

// ─── Actualités ──────────────────────────────────────────────────────────────

export const newsVisibility = pgEnum('news_visibility', ['PUBLIC', 'MEMBERS'])

export const news = pgTable(
  'news',
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull(),
    title: text().notNull(),
    excerpt: text().notNull(),
    body: text().notNull(),
    visibility: newsVisibility().notNull().default('PUBLIC'),
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
    /** Lien facultatif : chemin interne (/espace/…) ou adresse https. */
    linkUrl: text(),
    linkLabel: text(),
    tone: highlightTone().notNull().default('RED'),
    imageId: uuid().references(() => media.id, { onDelete: 'set null' }),
    visibility: newsVisibility().notNull().default('PUBLIC'),
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
export type MemberCategory = (typeof memberCategory.enumValues)[number]
export type Offer = typeof offers.$inferSelect
export type OfferTariff = typeof offerTariffs.$inferSelect
export type OfferKind = (typeof offerKind.enumValues)[number]
export type OfferCategory = (typeof offerCategory.enumValues)[number]
export type PublicationStatus = (typeof publicationStatus.enumValues)[number]
export type Order = typeof orders.$inferSelect
export type OrderLine = typeof orderLines.$inferSelect
export type OrderStatus = (typeof orderStatus.enumValues)[number]
export type Partner = typeof partners.$inferSelect
export type News = typeof news.$inferSelect
export type NewsVisibility = (typeof newsVisibility.enumValues)[number]
export type Highlight = typeof highlights.$inferSelect
export type HighlightTone = (typeof highlightTone.enumValues)[number]
export type Media = typeof media.$inferSelect
export type ContactMessage = typeof contactMessages.$inferSelect
