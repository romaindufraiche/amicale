import { z } from 'zod'

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
