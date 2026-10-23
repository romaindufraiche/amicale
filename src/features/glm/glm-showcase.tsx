import {
  ArrowUpRight,
  type LucideIcon,
  Database,
  Gauge,
  Globe,
  Pin,
  RefreshCcw,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
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
const EMAIL = 'contact@glmprime.com'

const EXPERTISES: { icon: LucideIcon; title: string; text: string; accent: string }[] = [
  {
    icon: Database,
    title: 'Traitement des données',
    text: 'Fichiers éparpillés, tableaux sans fin : vos données rassemblées, fiables et exploitables.',
    accent: GLM.corail,
  },
  {
    icon: ShieldCheck,
    title: 'Sécurisation des données',
    text: 'Accès maîtrisés, sauvegardes, bonnes pratiques de cybersécurité.',
    accent: GLM.jade,
  },
  {
    icon: Workflow,
    title: 'Automatisation des process',
    text: 'Ressaisies, relances, comptes rendus : les tâches répétitives tournent toutes seules.',
    accent: GLM.bleu,
  },
  {
    icon: RefreshCcw,
    title: 'Refonte de logiciels d’entreprise',
    text: 'Un outil vieillissant ou mal adapté, remis à neuf autour de votre façon de travailler.',
    accent: GLM.corail,
  },
  {
    icon: Gauge,
    title: 'Excellence opérationnelle',
    text: 'Tableaux de bord clairs, process simplifiés, décisions plus rapides.',
    accent: GLM.jade,
  },
  {
    icon: Globe,
    title: 'Sites web & communication',
    text: 'Un site comme celui de l’Amicale, pour votre association, votre club ou votre projet.',
    accent: GLM.bleu,
  },
]

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
        <span className="h-1.5 flex-1" style={{ background: GLM.corail }} />
        <span className="h-1.5 flex-1" style={{ background: GLM.jade }} />
        <span className="h-1.5 flex-1" style={{ background: GLM.bleu }} />
      </div>

      <div className="flex flex-col gap-10 p-6 sm:p-10 lg:p-12">
        <header className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-5">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2.5">
                <GlmSymbol size={32} />
                <span
                  className={cn(glmTitleFont.className, 'text-[1.625rem] leading-none tracking-[0.14em]')}
                >
                  GLM
                </span>
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold tracking-[0.14em] uppercase"
                style={{ color: GLM.ivoireDoux }}
              >
                <Pin aria-hidden className="size-3.5" /> Annonce · Le créateur de ce site
              </span>
            </p>
            <h2
              id="annonce-glm"
              className={cn(
                glmTitleFont.className,
                'text-[clamp(2.4rem,1.6rem+3.6vw,4.75rem)] leading-[1.02]',
              )}
            >
              Moins de paperasse.
              <span className="block" style={{ color: GLM.corail }}>
                Plus de terrain.
              </span>
            </h2>
            <p className="max-w-[40rem] text-[clamp(1.0625rem,1rem+0.3vw,1.3125rem)] leading-relaxed">
              Données, sécurité, process, logiciels : GLM conçoit les outils numériques qui font gagner du
              temps et laissent les équipes se concentrer sur l’essentiel.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end lg:text-right">
            <p style={{ color: GLM.ivoireDoux }}>Ce site a été réalisé par GLM.</p>
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center gap-2 px-7 text-[1.125rem] font-semibold transition-opacity hover:opacity-90"
              style={{ background: GLM.corail, color: GLM.nuit }}
            >
              Parlons de votre projet <ArrowUpRight aria-hidden className="size-5" />
              <span className="sr-only">(glmprime.com, nouvel onglet)</span>
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="text-[0.9375rem] underline underline-offset-4 hover:opacity-80"
            >
              {EMAIL}
            </a>
          </div>
        </header>

        <ul
          className="grid gap-px sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: 'rgb(244 239 228 / 0.14)' }}
        >
          {EXPERTISES.map(({ icon: Icon, title, text, accent }) => (
            <li key={title} className="flex flex-col gap-2 p-5 sm:p-6" style={{ background: GLM.nuit }}>
              <Icon aria-hidden className="size-7" style={{ color: accent }} strokeWidth={1.75} />
              <h3 className="text-[1.1875rem] font-semibold">{title}</h3>
              <p className="leading-snug" style={{ color: GLM.ivoireDoux }}>
                {text}
              </p>
            </li>
          ))}
        </ul>

        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-wrap items-center justify-between gap-4 border p-5 transition-colors hover:bg-white/5 sm:p-6"
          style={{ borderColor: 'rgb(244 239 228 / 0.35)' }}
        >
          <span
            className={cn(
              glmTitleFont.className,
              'text-[clamp(1.375rem,1.2rem+0.8vw,1.875rem)] leading-tight',
            )}
          >
            Un outil qui vous ralentit ? Une idée à concrétiser ?
          </span>
          <span className="inline-flex items-center gap-2 font-semibold" style={{ color: GLM.corail }}>
            Découvrir glmprime.com <ArrowUpRight aria-hidden className="size-5" />
            <span className="sr-only">(nouvel onglet)</span>
          </span>
        </a>
      </div>
    </article>
  )
}
