import { z } from 'zod'
import { MEMBER_CATEGORIES } from '@/features/members/categories'

export const PASSWORD_MIN = 12
export const PASSWORD_MAX = 128

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, { error: 'Adresse trop longue.' })
  .pipe(z.email({ error: 'Adresse email invalide.' }))

const passwordField = z
  .string()
  .min(PASSWORD_MIN, { error: `Au moins ${PASSWORD_MIN} caractères.` })
  .max(PASSWORD_MAX, { error: `${PASSWORD_MAX} caractères maximum.` })

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} est requis.` })
    .max(60, { error: '60 caractères maximum.' })

/** Chaîne optionnelle : une saisie vide devient `null`. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `${max} caractères maximum.` })
    .transform((value) => (value === '' ? null : value))

export const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s.-]/g, ''))
  .refine((value) => value === '' || /^(\+33|0)[1-9]\d{8}$/.test(value), {
    error: 'Numéro de téléphone invalide (ex. 06 12 34 56 78).',
  })
  .transform((value) => (value === '' ? null : value))

export const registerSchema = z
  .object({
    firstName: nameField('Le prénom'),
    lastName: nameField('Le nom'),
    email: emailField,
    phone: phoneField,
    category: z.enum(MEMBER_CATEGORIES, { error: 'Sélectionnez votre situation.' }),
    assignment: optionalText(120),
    password: passwordField,
    passwordConfirm: z.string(),
    certify: z.literal('on', { error: 'Cette attestation est nécessaire pour transmettre votre demande.' }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    error: 'Les deux mots de passe ne correspondent pas.',
  })

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: 'Saisissez votre mot de passe.' }).max(PASSWORD_MAX),
  next: z.string().optional(),
})

export const forgotPasswordSchema = z.object({ email: emailField })

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(100),
    password: passwordField,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    error: 'Les deux mots de passe ne correspondent pas.',
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: 'Saisissez votre mot de passe actuel.' }).max(PASSWORD_MAX),
    password: passwordField,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    error: 'Les deux mots de passe ne correspondent pas.',
  })

export const profileSchema = z.object({
  phone: phoneField,
  assignment: optionalText(120),
})

export type RegisterInput = z.infer<typeof registerSchema>
