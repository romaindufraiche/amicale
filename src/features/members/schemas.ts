import { z } from 'zod'

const isoDate = z.iso.date({ error: 'Date invalide.' })

export const approveMemberSchema = z.object({
  userId: z.uuid(),
  membershipValidUntil: isoDate,
})

export const renewMembershipSchema = approveMemberSchema

export const memberIdSchema = z.object({ userId: z.uuid() })

export const changeRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(['MEMBER', 'BUREAU', 'ADMIN'], { error: 'Rôle invalide.' }),
})
