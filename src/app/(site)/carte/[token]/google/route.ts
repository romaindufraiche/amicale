import { NextResponse } from 'next/server'
import { googleWalletConfig, googleWalletSaveUrl } from '@/features/member-cards/google-wallet'
import { memberFromLink } from '@/features/member-cards/public'
import { logger } from '@/server/logger'

type Context = { params: Promise<{ token: string }> }

/** Redirige vers « Enregistrer dans Google Wallet », depuis le lien personnel de l'adhérent. */
export async function GET(_request: Request, { params }: Context) {
  try {
    const config = googleWalletConfig()
    const member = config ? await memberFromLink((await params).token) : null
    if (!config || !member) return new NextResponse('Lien invalide ou expiré.', { status: 404 })
    return NextResponse.redirect(googleWalletSaveUrl(member, config), { status: 303 })
  } catch (error) {
    logger.error('wallet.google_failed', { error })
    return new NextResponse('La carte n’a pas pu être générée. Prévenez le bureau.', { status: 500 })
  }
}
