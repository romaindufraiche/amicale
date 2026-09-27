/**
 * Maintenance quotidienne (à planifier via cron) : supprime les sessions expirées,
 * les jetons échus ou utilisés, les compteurs de limitation périmés et les images
 * téléversées mais jamais rattachées à une offre ou un post.
 *
 *   pnpm maintenance:cleanup
 */
import 'dotenv/config'
import { lt, or, isNotNull } from 'drizzle-orm'
import { purgeOrphanMedia } from '@/features/media/service'
import { purgeExpiredSessions } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { userTokens } from '@/server/db/schema'
import { purgeExpiredRateLimits } from '@/server/rate-limit'

async function main() {
  const sessions = await purgeExpiredSessions()
  const tokens = await db
    .delete(userTokens)
    .where(or(lt(userTokens.expiresAt, new Date()), isNotNull(userTokens.usedAt)))
    .returning({ id: userTokens.id })
  const rateLimits = await purgeExpiredRateLimits()
  const orphanMedia = await purgeOrphanMedia()
  console.log(
    JSON.stringify({
      message: 'maintenance.cleanup',
      sessions,
      tokens: tokens.length,
      rateLimits,
      orphanMedia,
    }),
  )
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
