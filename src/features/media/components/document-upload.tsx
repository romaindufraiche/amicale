'use client'

import { FileText, LoaderCircle, Paperclip, Trash2 } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { uploadDocumentAction } from '../actions'
import { ACCEPTED_DOCUMENT_TYPES, documentUrl, MAX_DOCUMENT_BYTES } from '../constants'

export type AttachedDocument = { id: string; fileName: string; sizeBytes: number }

type Status = { state: 'idle' } | { state: 'uploading' } | { state: 'error'; message: string }

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
    : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`
}

/**
 * Fichier joint (PDF ou JPEG) : envoyé dès sa sélection ; le formulaire parent ne transmet
 * ensuite que son identifiant (champ caché `name`).
 */
export function DocumentUpload({
  name,
  label,
  hint,
  defaultDocument,
  error,
}: {
  name: string
  label: string
  hint?: string
  defaultDocument: AttachedDocument | null
  error?: string
}) {
  const [document, setDocument] = useState(defaultDocument)
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  async function upload(file: File) {
    if (!(ACCEPTED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
      setStatus({ state: 'error', message: 'Format non pris en charge : utilisez un fichier PDF ou JPEG.' })
      return
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setStatus({ state: 'error', message: 'Fichier trop lourd : 4 Mo maximum.' })
      return
    }
    setStatus({ state: 'uploading' })
    const body = new FormData()
    body.append('file', file)
    const result = await uploadDocumentAction(body)
    if (result.ok) {
      setDocument({ id: result.id, fileName: result.fileName, sizeBytes: result.sizeBytes })
      setStatus({ state: 'idle' })
    } else {
      setStatus({ state: 'error', message: result.message })
    }
  }

  const message = status.state === 'error' ? status.message : error
  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={document?.id ?? ''} />
      <p id={`${id}-label`} className="font-semibold">
        {label}
      </p>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {document ? (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-surface p-3">
          <FileText aria-hidden className="size-5 text-blue-600" />
          <a href={documentUrl(document.id)} target="_blank" rel="noopener noreferrer" className="link">
            {document.fileName}
          </a>
          <span className="text-sm text-ink-muted">{formatSize(document.sizeBytes)}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setDocument(null)}>
            <Trash2 aria-hidden className="size-4" /> Retirer
          </Button>
        </div>
      ) : null}
      <div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
          className="sr-only"
          aria-labelledby={`${id}-label`}
          aria-describedby={
            [hint ? `${id}-hint` : null, message ? `${id}-error` : null].filter(Boolean).join(' ') ||
            undefined
          }
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.target.value = ''
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={status.state === 'uploading'}
          onClick={() => inputRef.current?.click()}
        >
          {status.state === 'uploading' ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Paperclip aria-hidden className="size-4" />
          )}
          {status.state === 'uploading' ? 'Envoi…' : document ? 'Remplacer le fichier' : 'Ajouter un fichier'}
        </Button>
      </div>
      <p aria-live="polite" id={`${id}-error`} className="text-sm font-semibold text-danger-700">
        {message ?? ''}
      </p>
    </div>
  )
}
