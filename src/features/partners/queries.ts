import 'server-only'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/server/db/client'
import { documents, partners } from '@/server/db/schema'

export async function listPublishedPartners() {
  return db
    .select({
      id: partners.id,
      name: partners.name,
      category: partners.category,
      advantage: partners.advantage,
      description: partners.description,
      howToBenefit: partners.howToBenefit,
      websiteUrl: partners.websiteUrl,
      imageId: partners.imageId,
      attachmentId: partners.attachmentId,
      attachmentMimeType: documents.mimeType,
    })
    .from(partners)
    .leftJoin(documents, eq(documents.id, partners.attachmentId))
    .where(eq(partners.published, true))
    .orderBy(asc(partners.position), asc(partners.name))
}

export async function listPartnersForAdmin() {
  return db.select().from(partners).orderBy(asc(partners.position), desc(partners.updatedAt))
}

export async function getPartnerForAdmin(id: string) {
  const [row] = await db.select().from(partners).where(eq(partners.id, id)).limit(1)
  return row ?? null
}
