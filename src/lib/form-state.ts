import type { z } from 'zod'

/**
 * État renvoyé par une action serveur de formulaire.
 * `values` permet de réafficher la saisie après une erreur (React réinitialise
 * les formulaires après chaque soumission) ; les mots de passe n'y figurent jamais.
 */
export type FormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Partial<Record<string, string>>
  values?: Record<string, string>
}

export const idleState: FormState = { status: 'idle' }

const SENSITIVE_FIELDS = /password|token/i

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$') && !SENSITIVE_FIELDS.test(key)) values[key] = value
  }
  return values
}

export function validationError(error: z.ZodError, formData: FormData): FormState {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    fieldErrors[key] ??= issue.message
  }
  return {
    status: 'error',
    message: 'Certains champs sont à corriger.',
    fieldErrors,
    values: formValues(formData),
  }
}

export function errorState(message: string, formData?: FormData): FormState {
  return { status: 'error', message, values: formData ? formValues(formData) : undefined }
}
