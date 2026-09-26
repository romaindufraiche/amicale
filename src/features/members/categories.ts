import type { MemberCategory } from '@/server/db/schema'

export const MEMBER_CATEGORY_LABELS: Record<MemberCategory, string> = {
  ACTIF: 'Personnel actif',
  RETRAITE: 'Retraité·e',
  ADMINISTRATIF: 'Personnel administratif, technique ou scientifique',
  AUTRE: 'Autre situation',
}

export const MEMBER_CATEGORIES = Object.keys(MEMBER_CATEGORY_LABELS) as MemberCategory[]
