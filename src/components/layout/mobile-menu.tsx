'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

type NavItem = { href: string; label: string }

/**
 * Navigation mobile : panneau déroulant sous l'en-tête.
 * Se referme au changement de page et avec la touche Échap (focus rendu au bouton).
 */
export function MobileMenu({ items, footer }: { items: readonly NavItem[]; footer: ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [lastPathname, setLastPathname] = useState(pathname)

  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-sm px-3 font-display font-bold text-ink hover:bg-sunken"
      >
        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        Menu
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 border-t border-line bg-paper shadow-overlay"
      >
        <nav aria-label="Navigation principale" className="mx-auto flex max-w-page flex-col px-4 py-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined
              }
              className="border-b border-line py-3.5 font-display text-lead font-bold aria-[current=page]:text-red-700"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-5">{footer}</div>
        </nav>
      </div>
    </div>
  )
}
