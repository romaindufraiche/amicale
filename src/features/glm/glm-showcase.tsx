import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { glmTextFont, glmTitleFont } from './fonts'

/*
 * Annonce épinglée de GLM, l'entreprise qui a conçu et réalisé le site de l'Amicale.
 * Bandeau publicitaire compact, aux couleurs de glmprime.com : fond nuit, texte ivoire,
 * filet corail-jade-bleu, titres en Libre Caslon Display, texte en IBM Plex Sans.
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
  'Traitement et sécurisation des données',
  'Cybersécurité',
  'Automatisation des processus',
  'Intelligence artificielle interne sur mesure',
  'Logiciels d’entreprise sur mesure',
  'Applications',
  'Tableaux de bord',
  'Sites web',
  'E-commerce',
  'Campagnes de communication',
  'Prospection',
  'Personal branding',
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
    <aside
      aria-labelledby="annonce-glm"
      className={cn('relative overflow-hidden', glmTextFont.className, className)}
      style={{ background: GLM.nuit, color: GLM.ivoire }}
    >
      <div aria-hidden className="flex">
        <span className="h-1 flex-1" style={{ background: GLM.corail }} />
        <span className="h-1 flex-1" style={{ background: GLM.jade }} />
        <span className="h-1 flex-1" style={{ background: GLM.bleu }} />
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:gap-10">
        <div className="flex shrink-0 items-center gap-3">
          <GlmSymbol size={52} />
          <div className="flex flex-col gap-1">
            <span className={cn(glmTitleFont.className, 'text-[2rem] leading-none tracking-[0.14em]')}>
              GLM
            </span>
            <span
              className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: GLM.ivoireDoux }}
            >
              Annonce
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2
            id="annonce-glm"
            className={cn(
              glmTitleFont.className,
              'text-[clamp(1.625rem,1.3rem+1.4vw,2.375rem)] leading-[1.1]',
            )}
          >
            Ce site, c’est nous. <span style={{ color: GLM.corail }}>Et votre projet ?</span>
          </h2>
          <p className="text-[1rem] leading-snug">
            Architectes de la tech : on conçoit et on développe des solutions pour les entreprises, avec les
            entreprises.
          </p>
          <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Domaines de GLM">
            {SERVICES.map((service) => (
              <li
                key={service}
                className="border px-2 py-0.5 text-[0.8125rem] leading-snug"
                style={{ borderColor: 'rgb(244 239 228 / 0.3)', color: GLM.ivoireDoux }}
              >
                {service}
              </li>
            ))}
          </ul>
        </div>

        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start px-6 text-[1.0625rem] font-semibold transition-opacity hover:opacity-90 lg:self-center"
          style={{ background: GLM.corail, color: GLM.nuit }}
        >
          Parlez-nous de votre projet <ArrowUpRight aria-hidden className="size-5" />
          <span className="sr-only">(glmprime.com, nouvel onglet)</span>
        </a>
      </div>
    </aside>
  )
}
