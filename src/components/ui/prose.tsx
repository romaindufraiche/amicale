import type { ReactNode } from 'react'

/** Mise en forme des textes longs (pages légales) : titres, paragraphes, listes et liens. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-prose flex-col gap-5 [&_a]:link [&_h2]:mt-8 [&_h2]:text-h3 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
      {children}
    </div>
  )
}
