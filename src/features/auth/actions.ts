'use server'

import { redirect } from 'next/navigation'
import { errorState, type FormState, validationError } from '@/lib/form-state'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { runFormAction } from '@/server/action'
import { homePathFor, requireSession } from '@/server/auth/guards'
import { createSession, destroyCurrentSession } from '@/server/auth/session'
import { updateOwnProfile } from '@/features/members/service'
import { consumeRateLimit, formatRetryAfter } from '@/server/rate-limit'
import { getClientIp, getUserAgent } from '@/server/request-context'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from './schemas'
import { authenticate, changePassword, registerMember, requestPasswordReset, resetPassword } from './service'

export async function registerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('register', formData, async () => {
    const parsed = registerSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const result = await registerMember(parsed.data, await getClientIp())
    if (!result.ok) {
      return errorState(
        `Trop de demandes depuis votre connexion. Réessayez ${formatRetryAfter(result.retryAfterSeconds)}.`,
        formData,
      )
    }
    redirect(`/inscription/confirmation?email=${encodeURIComponent(parsed.data.email)}`)
  })
}

const LOGIN_ERRORS = {
  INVALID_CREDENTIALS: 'Adresse email ou mot de passe incorrect.',
  EMAIL_NOT_VERIFIED:
    "Votre adresse email n'est pas encore confirmée. Nous venons de vous renvoyer le lien de confirmation.",
  SUSPENDED: 'Votre compte est suspendu. Contactez le bureau de l’Amicale pour en savoir plus.',
  REJECTED: "Votre demande d'adhésion n'a pas été retenue. Contactez le bureau pour toute question.",
} as const

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('login', formData, async () => {
    const parsed = loginSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const result = await authenticate(parsed.data.email, parsed.data.password, await getClientIp())
    if (!result.ok) {
      const message =
        result.reason === 'RATE_LIMITED'
          ? `Trop de tentatives de connexion. Réessayez ${formatRetryAfter(result.retryAfterSeconds)}.`
          : LOGIN_ERRORS[result.reason]
      return errorState(message, formData)
    }

    await createSession(result.userId, await getUserAgent())
    redirect(safeRedirectPath(parsed.data.next, homePathFor(result.role)))
  })
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession()
  redirect('/')
}

export async function forgotPasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('forgot-password', formData, async () => {
    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const result = await requestPasswordReset(parsed.data.email, await getClientIp())
    if (!result.ok) {
      return errorState(
        `Trop de demandes. Réessayez ${formatRetryAfter(result.retryAfterSeconds)}.`,
        formData,
      )
    }
    return {
      status: 'success',
      message:
        'Si un compte est associé à cette adresse, vous allez recevoir un email contenant un lien de réinitialisation valable une heure.',
    }
  })
}

export async function resetPasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('reset-password', formData, async () => {
    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const done = await resetPassword(parsed.data.token, parsed.data.password)
    if (!done) {
      return errorState(
        'Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande de réinitialisation.',
      )
    }
    redirect('/connexion?reinitialise=1')
  })
}

export async function changePasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('change-password', formData, async () => {
    const session = await requireSession('/espace/profil')
    const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    const limit = await consumeRateLimit(`password:change:${session.user.id}`, 5, 15 * 60 * 1000)
    if (!limit.allowed)
      return errorState(`Trop de tentatives. Réessayez ${formatRetryAfter(limit.retryAfterSeconds)}.`)

    const changed = await changePassword(
      session.user.id,
      session.sessionId,
      parsed.data.currentPassword,
      parsed.data.password,
    )
    if (!changed) {
      return {
        status: 'error',
        message: 'Certains champs sont à corriger.',
        fieldErrors: { currentPassword: 'Mot de passe actuel incorrect.' },
      }
    }
    return { status: 'success', message: 'Mot de passe modifié. Vos autres sessions ont été déconnectées.' }
  })
}

export async function updateProfileAction(_previous: FormState, formData: FormData): Promise<FormState> {
  return runFormAction('update-profile', formData, async () => {
    const { user } = await requireSession('/espace/profil')
    const parsed = profileSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return validationError(parsed.error, formData)

    await updateOwnProfile(user.id, parsed.data)
    return {
      status: 'success',
      message: 'Vos coordonnées ont été mises à jour.',
      values: { phone: parsed.data.phone ?? '', assignment: parsed.data.assignment ?? '' },
    }
  })
}
