import 'server-only'
import { eq } from 'drizzle-orm'
import { cache } from 'react'
import { db } from '@/server/db/client'
import { siteSettings } from '@/server/db/schema'

/** Saison par défaut des cartes d'adhérent, tant que le bureau ne l'a pas changée. */
export const DEFAULT_CARD_SEASON = '2027'

export type SiteSettingsValues = {
  membershipUrl: string | null
  ordersEmail: string | null
  /** Faux : adhésions fermées, boutons « Adhérer en ligne » masqués. */
  membershipOpen: boolean
  /** Nombre d'adhérents saisi par le bureau ; `null` : non affiché. */
  memberCount: number | null
  /** Saison imprimée sur les cartes d'adhérent. */
  cardSeason: string
}

/** Réglages du site ; valeurs vides tant que le bureau ne les a pas renseignés. Lus une fois par requête. */
export const getSiteSettings = cache(async (): Promise<SiteSettingsValues> => {
  const [row] = await db
    .select({
      membershipUrl: siteSettings.membershipUrl,
      ordersEmail: siteSettings.ordersEmail,
      membershipOpen: siteSettings.membershipOpen,
      memberCount: siteSettings.memberCount,
      cardSeason: siteSettings.cardSeason,
    })
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1)
  return {
    membershipUrl: row?.membershipUrl ?? null,
    ordersEmail: row?.ordersEmail ?? null,
    membershipOpen: row?.membershipOpen ?? true,
    memberCount: row?.memberCount ?? null,
    cardSeason: row?.cardSeason ?? DEFAULT_CARD_SEASON,
  }
})
