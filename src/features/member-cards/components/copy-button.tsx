'use client'

import { Check, Link2 } from 'lucide-react'
import { useState } from 'react'
import { buttonClasses } from '@/components/ui/button'

/** Copie le lien personnel d'un adhérent dans le presse-papiers. */
export function CopyLinkButton({ url, label = 'Copier le lien adhérent' }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={buttonClasses('ghost', 'sm')}
      onClick={() => {
        void navigator.clipboard.writeText(url).then(() => setCopied(true))
      }}
    >
      {copied ? <Check aria-hidden className="size-4" /> : <Link2 aria-hidden className="size-4" />}
      {copied ? 'Lien copié' : label}
    </button>
  )
}
