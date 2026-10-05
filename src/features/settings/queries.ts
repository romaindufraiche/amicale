import 'server-only'
import { eq } from 'drizzle-orm'
import { cache } from 'react'
import { db } from '@/server/db/client'
import { siteSettings } from '@/server/db/schema'

export type PublicSettings = { membershipUrl: string | null }

/** Réglages du site ; valeurs vides tant que le bureau ne les a pas renseignés. Lus une fois par requête. */
export const getSiteSettings = cache(async (): Promise<PublicSettings> => {
  const [row] = await db
    .select({ membershipUrl: siteSettings.membershipUrl })
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1)
  return { membershipUrl: row?.membershipUrl ?? null }
})
