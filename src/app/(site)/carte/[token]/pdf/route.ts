import { NextResponse } from 'next/server'
import { cardFileName } from '@/features/member-cards/files'
import { buildMemberCardPdf } from '@/features/member-cards/pdf'
import { memberFromLink } from '@/features/member-cards/public'

type Context = { params: Promise<{ token: string }> }

/** PDF de la carte, depuis le lien personnel de l'adhérent. */
export async function GET(_request: Request, { params }: Context) {
  const member = await memberFromLink((await params).token)
  if (!member) return new NextResponse('Lien invalide ou expiré.', { status: 404 })
  const pdf = await buildMemberCardPdf(member, member.season, 'carte')
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${cardFileName(member)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
