'use client'

import { ImageUp, LoaderCircle, Trash2 } from 'lucide-react'
import { type DragEvent, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { uploadImageAction } from '../actions'
import { ACCEPTED_IMAGE_TYPES, MAX_SOURCE_BYTES, MAX_UPLOAD_BYTES, mediaUrl } from '../constants'
import { isAcceptedImage, prepareImage } from '../prepare-image'

type Status = { state: 'idle' } | { state: 'uploading' } | { state: 'error'; message: string }

/**
 * Zone de dépôt d'image : glisser-déposer ou sélection au clavier/à la souris.
 * L'image est envoyée immédiatement ; le formulaire parent ne transmet ensuite que
 * son identifiant (champ caché `name`).
 */
export function ImageDropzone({
  name,
  label,
  hint,
  defaultMediaId,
  error,
}: {
  name: string
  label: string
  hint?: string
  defaultMediaId: string | null
  error?: string
}) {
  const [mediaId, setMediaId] = useState(defaultMediaId)
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const hintId = `${id}-hint`
  const statusId = `${id}-status`

  async function upload(source: File) {
    if (!isAcceptedImage(source)) {
      setStatus({
        state: 'error',
        message: 'Format non pris en charge : utilisez une image JPEG, PNG ou WebP.',
      })
      return
    }
    if (source.size > MAX_SOURCE_BYTES) {
      setStatus({ state: 'error', message: 'Image trop lourde : 30 Mo maximum.' })
      return
    }
    setStatus({ state: 'uploading' })
    try {
      const file = await prepareImage(source)
      if (file.size > MAX_UPLOAD_BYTES) {
        setStatus({
          state: 'error',
          message: 'Image trop lourde, même après réduction. Essayez une image plus petite.',
        })
        return
      }
      const data = new FormData()
      data.append('file', file)
      const result = await uploadImageAction(data)
      if (result.ok) {
        setMediaId(result.id)
        setStatus({ state: 'idle' })
      } else {
        setStatus({ state: 'error', message: result.message })
      }
    } catch {
      setStatus({ state: 'error', message: 'L’envoi a échoué. Vérifiez votre connexion et réessayez.' })
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void upload(file)
  }

  const uploading = status.state === 'uploading'
  const message = status.state === 'error' ? status.message : error

  return (
    <div className="flex flex-col gap-1.5">
      <p id={`${id}-label`} className="font-semibold text-ink">
        {label} <span className="font-normal text-ink-muted">(facultatif)</span>
      </p>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      <input type="hidden" name={name} value={mediaId ?? ''} />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          event.target.value = ''
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-labelledby={`${id}-label`}
        aria-describedby={[hint ? hintId : null, statusId].filter(Boolean).join(' ')}
        role="group"
        className={cn(
          'relative overflow-hidden rounded-md border-2 border-dashed transition-colors',
          dragging
            ? 'border-blue-500 bg-blue-50'
            : message
              ? 'border-danger-700'
              : 'border-line-strong bg-surface',
        )}
      >
        {mediaId ? (
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu d'une image déjà optimisée par le serveur */}
            <img
              src={mediaUrl(mediaId)}
              alt="Aperçu de l’image"
              className="aspect-video w-full rounded-sm object-cover sm:w-64"
            />
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink-muted">Glissez une autre image ici pour la remplacer.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  <ImageUp aria-hidden className="size-4" /> Remplacer
                </Button>
                <Button variant="ghost" size="sm" disabled={uploading} onClick={() => setMediaId(null)}>
                  <Trash2 aria-hidden className="size-4" /> Retirer l’image
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <ImageUp aria-hidden className="size-10 text-ink-muted" />
            <p className="font-semibold">Glissez-déposez une image ici</p>
            <p className="text-sm text-ink-muted">
              JPEG, PNG ou WebP · format paysage conseillé · photos lourdes réduites automatiquement
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              Choisir un fichier
            </Button>
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-surface/90 font-semibold">
            <LoaderCircle aria-hidden className="size-5 animate-spin" /> Envoi de l’image…
          </div>
        ) : null}
      </div>

      <p
        id={statusId}
        role="status"
        className={cn('text-sm font-semibold', message ? 'text-danger-700' : 'sr-only')}
      >
        {message ?? (uploading ? 'Envoi de l’image en cours.' : mediaId ? 'Image ajoutée.' : '')}
      </p>
    </div>
  )
}
