import 'server-only'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { partners } from '@/server/db/schema'

export async function listPublishedPartners() {
  return db
    .select()
    .from(partners)
    .where(eq(partners.published, true))
    .orderBy(asc(partners.category), asc(partners.name))
}

export async function listPartnersForAdmin() {
  return db.select().from(partners).orderBy(desc(partners.updatedAt))
}

export async function getPartnerForAdmin(id: string) {
  const [row] = await db.select().from(partners).where(eq(partners.id, id)).limit(1)
  return row ?? null
}
