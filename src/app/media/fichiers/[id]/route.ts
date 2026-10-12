import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDocument } from '@/features/media/service'

/** Sert un fichier joint (PDF ou JPEG), affiché par le navigateur et téléchargeable sous son nom. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id)
  const file = id.success ? await getDocument(id.data) : null
  if (!file) return new NextResponse('Introuvable', { status: 404 })

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.data.length),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
