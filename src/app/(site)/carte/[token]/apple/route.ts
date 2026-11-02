import { NextResponse } from 'next/server'
import { appleWalletConfig, buildApplePass } from '@/features/member-cards/apple-wallet'
import { memberFromLink } from '@/features/member-cards/public'
import { logger } from '@/server/logger'

type Context = { params: Promise<{ token: string }> }

/** Carte au format Apple Wallet (.pkpass), depuis le lien personnel de l'adhérent. */
export async function GET(_request: Request, { params }: Context) {
  const config = appleWalletConfig()
  const member = config ? await memberFromLink((await params).token) : null
  if (!config || !member) return new NextResponse('Lien invalide ou expiré.', { status: 404 })
  try {
    const pass = await buildApplePass(member, config)
    return new NextResponse(Buffer.from(pass), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="carte-adherent-adpvo.pkpass"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logger.error('wallet.apple_failed', { error })
    return new NextResponse('La carte n’a pas pu être générée. Prévenez le bureau.', { status: 500 })
  }
}
