import { ArrowUpRight, Pin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { glmTextFont, glmTitleFont } from './fonts'

/*
 * Annonce épinglée de GLM, l'entreprise qui a conçu et réalisé le site de l'Amicale.
 * Format publicitaire, aux couleurs de glmprime.com : fond nuit, texte ivoire, filet
 * corail-jade-bleu, titres en Libre Caslon Display, texte en IBM Plex Sans, angles droits.
 */
const GLM = {
  nuit: '#0B1533',
  ivoire: '#F4EFE4',
  ivoireDoux: '#BAB9B8',
  corail: '#E9674F',
  jade: '#2FA877',
  bleu: '#3F63F2',
}

const SITE_URL = 'https://glmprime.com'

const SERVICES = [
  'Sites web',
  'Communication',
  'Développement de logiciels',
  'Automatisation des processus',
] as const

/** Situations où un collègue, du gardien de la paix au commissaire, peut avoir besoin de GLM. */
const USE_CASES = [
  {
    accent: GLM.corail,
    text: 'Votre association, votre club sportif ou votre événement mérite son propre site ?',
  },
  {
    accent: GLM.jade,
    text: 'Un projet personnel, l’activité de votre conjoint ou votre après-carrière à lancer ?',
  },
  {
    accent: GLM.bleu,
    text: 'Des inscriptions, des plannings ou des relances encore gérés à la main ? On les automatise.',
  },
] as const

/** Symbole GLM : trois bandes corail, jade et bleu sur fond nuit. */
function GlmSymbol({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden focusable="false">
      <rect width="120" height="120" fill={GLM.nuit} />
      <rect x="30" y="30" width="20" height="60" fill={GLM.corail} />
      <rect x="50" y="30" width="20" height="60" fill={GLM.jade} />
      <rect x="70" y="30" width="20" height="60" fill={GLM.bleu} />
    </svg>
  )
}

export function GlmShowcase({ className }: { className?: string }) {
  return (
    <article
      aria-labelledby="annonce-glm"
      className={cn('relative overflow-hidden', glmTextFont.className, className)}
      style={{ background: GLM.nuit, color: GLM.ivoire }}
    >
      <div aria-hidden className="flex">
        <span className="h-1 flex-1" style={{ background: GLM.corail }} />
        <span className="h-1 flex-1" style={{ background: GLM.jade }} />
        <span className="h-1 flex-1" style={{ background: GLM.bleu }} />
      </div>

      <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        <div className="flex flex-col gap-5">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-2.5">
              <GlmSymbol size={32} />
              <span className={cn(glmTitleFont.className, 'text-[1.625rem] leading-none tracking-[0.14em]')}>
                GLM
              </span>
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: GLM.ivoireDoux }}
            >
              <Pin aria-hidden className="size-3.5" /> Annonce
            </span>
          </p>

          <h2
            id="annonce-glm"
            className={cn(glmTitleFont.className, 'text-[clamp(2rem,1.5rem+2.4vw,3.5rem)] leading-[1.08]')}
          >
            Ce site a été réalisé par GLM.
            <span className="block" style={{ color: GLM.corail }}>
              Parlons de votre projet.
            </span>
          </h2>

          <ul className="flex flex-wrap gap-2" aria-label="Ce que fait GLM">
            {SERVICES.map((service) => (
              <li
                key={service}
                className="border px-3 py-1.5 text-[0.9375rem] font-semibold"
                style={{ borderColor: 'rgb(244 239 228 / 0.35)' }}
              >
                {service}
              </li>
            ))}
          </ul>

          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 self-start px-6 text-[1.0625rem] font-semibold transition-opacity hover:opacity-90"
            style={{ background: GLM.ivoire, color: GLM.nuit }}
          >
            Découvrir GLM <ArrowUpRight aria-hidden className="size-5" />
            <span className="sr-only">(glmprime.com, nouvel onglet)</span>
          </a>
        </div>

        <ul className="flex flex-col gap-3">
          {USE_CASES.map((item) => (
            <li
              key={item.text}
              className="border-l-4 py-2 pl-4 text-[1.0625rem] leading-snug"
              style={{ borderColor: item.accent, background: 'rgb(244 239 228 / 0.05)' }}
            >
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
