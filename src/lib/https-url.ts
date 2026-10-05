import { z } from 'zod'

/** Adresse web absolue en https (les autres schémas, dont `javascript:`, sont refusés). */
export function isHttpsUrl(value: string): boolean {
  if (!/^https:\/\//i.test(value) || !URL.canParse(value)) return false
  return new URL(value).hostname.includes('.')
}

/** Champ de formulaire facultatif : lien https, vide → `null`. */
export const optionalHttpsUrl = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim())
  .refine((value) => value === '' || (value.length <= 500 && isHttpsUrl(value)), {
    error: 'Adresse invalide : collez le lien complet, commençant par https://',
  })
  .transform((value) => (value === '' ? null : value))
