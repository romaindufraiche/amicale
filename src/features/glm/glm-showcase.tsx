import { ArrowUpRight, Mail, Pin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { glmTextFont, glmTitleFont } from './fonts'

/*
 * Annonce épinglée de GLM, l'entreprise qui a conçu et réalisé le site de l'Amicale.
 * Elle reprend la charte de glmprime.com : fond nuit, texte ivoire, filet corail-jade-bleu,
 * titres en Libre Caslon Display, texte en IBM Plex Sans, angles droits.
 * Textes repris du site glmprime.com.
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
const LINKEDIN_URL = 'https://www.linkedin.com/company/glmprime'

const EXPERTISES = [
  {
    number: '01',
    kicker: 'La façade',
    title: 'Web & communication',
    text: 'Sites, e-commerce, applications, personal branding, campagnes de prospection et de communication.',
    accent: GLM.corail,
  },
  {
    number: '02',
    kicker: 'La structure',
    title: 'Automatisation & IA',
    text: 'Process automatisés, données, IA intégrée à vos outils.',
    accent: GLM.jade,
  },
  {
    number: '03',
    kicker: 'L’extension',
    title: 'Robotique',
    text: 'Robots autonomes pilotés par IA.',
    accent: GLM.bleu,
    badge: 'En préparation',
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

/** Filet de la charte : trois segments corail, jade, bleu. */
function Filet({ wide = false }: { wide?: boolean }) {
  const segment = wide ? 'h-1 w-10' : 'h-[3px] w-3'
  return (
    <span aria-hidden className="inline-flex shrink-0">
      <span className={segment} style={{ background: GLM.corail }} />
      <span className={segment} style={{ background: GLM.jade }} />
      <span className={segment} style={{ background: GLM.bleu }} />
    </span>
  )
}

export function GlmShowcase({ className }: { className?: string }) {
  return (
    <article
      aria-labelledby="annonce-glm"
      className={cn('relative overflow-hidden', glmTextFont.className, className)}
      style={{ background: GLM.nuit, color: GLM.ivoire }}
    >
      <div className="flex">
        <span className="h-1 flex-1" style={{ background: GLM.corail }} />
        <span className="h-1 flex-1" style={{ background: GLM.jade }} />
        <span className="h-1 flex-1" style={{ background: GLM.bleu }} />
      </div>

      <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="flex flex-col gap-6">
          <p
            className="flex flex-wrap items-center gap-3 text-[0.8125rem] font-semibold tracking-[0.14em] uppercase"
            style={{ color: GLM.ivoireDoux }}
          >
            <Filet />
            <span className="inline-flex items-center gap-1.5">
              <Pin aria-hidden className="size-3.5" /> Annonce épinglée
            </span>
            <span aria-hidden>·</span>
            <span>Le créateur du site</span>
          </p>

          <p className="inline-flex items-center gap-3">
            <GlmSymbol size={40} />
            <span className={cn(glmTitleFont.className, 'text-[2rem] leading-none tracking-[0.14em]')}>
              GLM
            </span>
          </p>

          <h2
            id="annonce-glm"
            className={cn(
              glmTitleFont.className,
              'text-[clamp(2.25rem,1.6rem+2.6vw,3.75rem)] leading-[1.08]',
            )}
          >
            Architectes de la tech
          </h2>
          <div className="flex max-w-[38rem] flex-col gap-3 text-[1.0625rem] leading-relaxed">
            <p className="text-[1.25rem]">
              On conçoit et on construit les systèmes numériques des entreprises.
            </p>
            <p style={{ color: GLM.ivoireDoux }}>
              Du site web à l’automatisation et à l’intelligence artificielle, et demain jusqu’aux robots. Une
              seule équipe, du premier échange à la mise en service.
            </p>
            <p>
              <strong className="font-semibold" style={{ color: GLM.corail }}>
                GLM a conçu et réalisé le site de l’Amicale.
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 px-5 font-semibold transition-colors hover:opacity-90"
              style={{ background: GLM.ivoire, color: GLM.nuit }}
            >
              Parlons de votre projet <ArrowUpRight aria-hidden className="size-4" />
              <span className="sr-only">(glmprime.com, nouvel onglet)</span>
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex min-h-12 items-center gap-2 border px-5 font-semibold transition-colors hover:bg-white/10"
              style={{ borderColor: GLM.ivoire }}
            >
              <Mail aria-hidden className="size-4" /> {EMAIL}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <p className={cn(glmTitleFont.className, 'text-[1.75rem] leading-tight')}>
            Un champ large, un rôle précis.
          </p>
          <ul className="flex flex-col">
            {EXPERTISES.map((item) => (
              <li
                key={item.number}
                className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 border-t py-5"
                style={{ borderColor: 'rgb(244 239 228 / 0.18)' }}
              >
                <span
                  className={cn(glmTitleFont.className, 'row-span-3 text-[2.5rem] leading-none')}
                  style={{ color: item.accent }}
                >
                  {item.number}
                </span>
                <span
                  className="text-[0.8125rem] font-semibold tracking-[0.14em] uppercase"
                  style={{ color: GLM.ivoireDoux }}
                >
                  {item.kicker}
                </span>
                <span className="flex flex-wrap items-center gap-3 text-[1.25rem] font-semibold">
                  {item.title}
                  {'badge' in item ? (
                    <span
                      className="border px-2 py-0.5 text-[0.75rem] font-semibold tracking-[0.14em] uppercase"
                      style={{ borderColor: item.accent, color: GLM.ivoire }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span style={{ color: GLM.ivoireDoux }}>{item.text}</span>
              </li>
            ))}
          </ul>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem]">
            <Filet wide />
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:opacity-80"
            >
              glmprime.com<span className="sr-only"> (nouvel onglet)</span>
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:opacity-80"
            >
              LinkedIn<span className="sr-only"> : suivre GLM (nouvel onglet)</span>
            </a>
          </p>
        </div>
      </div>
    </article>
  )
}
