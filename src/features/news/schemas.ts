import { z } from 'zod'
import { slugify } from '@/lib/slug'

export const newsSchema = z
  .object({
    title: z.string().trim().min(3, { error: 'Titre requis (3 caractères minimum).' }).max(140),
    slug: z.string().trim().max(80),
    excerpt: z
      .string()
      .trim()
      .min(10, { error: 'Chapô requis (10 caractères minimum).' })
      .max(280, { error: '280 caractères maximum.' }),
    body: z.string().trim().min(20, { error: 'Texte requis (20 caractères minimum).' }).max(20000),
    visibility: z.enum(['PUBLIC', 'MEMBERS'], { error: 'Visibilité invalide.' }),
  })
  .transform((data) => ({ ...data, slug: slugify(data.slug || data.title) }))
  .refine((data) => data.slug.length >= 3, { path: ['slug'], error: 'Adresse de page trop courte.' })

export type NewsInput = z.output<typeof newsSchema>

export const newsStatusSchema = z.object({
  newsId: z.uuid(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})
