import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getMedia } from '@/features/media/service'

/**
 * Sert une image téléversée. L'identifiant ne change jamais pour un contenu donné
 * (une nouvelle image = un nouvel identifiant) : mise en cache longue et immuable.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id)
  const file = id.success ? await getMedia(id.data) : null
  if (!file) return new NextResponse('Introuvable', { status: 404 })

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.data.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  })
}
