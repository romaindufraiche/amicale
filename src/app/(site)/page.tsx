import { ArrowRight, Handshake, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { site } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/page-header'
import { HighlightsMarquee } from '@/features/highlights/components/highlights-marquee'
import { listActiveHighlights } from '@/features/highlights/queries'
import { NewsList } from '@/features/news/components/news-list'
import { OfferCard } from '@/features/offers/components/offer-card'
import { CATEGORY_ICONS, CATEGORY_TONES } from '@/features/offers/components/offer-visual'
import { OFFER_CATEGORY_LABELS } from '@/features/offers/labels'
import { listPublishedOffers } from '@/features/offers/queries'
import { offerAvailability } from '@/features/offers/rules'
import { parisDay } from '@/lib/dates'
import { listPublishedNews } from '@/features/news/queries'
import { JoinLink } from '@/features/settings/components/join-link'
import { MemberCount } from '@/features/settings/components/member-count'

const BENEFITS = [
  {
    title: 'Billetterie à tarifs adhérents',
    text: 'Cinéma, parcs de loisirs, spectacles, sport : commandez vos billets en ligne au prix négocié par l’Amicale, avec un paiement sécurisé sur HelloAsso.',
  },
  {
    title: 'Sorties et événements',
    text: 'Les sorties organisées par l’Amicale sont annoncées sur le site. Inscrivez-vous en quelques clics, dans la limite des places disponibles.',
  },
  {
    title: 'Avantages partenaires',
    text: 'Les réductions et conditions préférentielles obtenues par l’Amicale auprès de ses partenaires.',
  },
] as const

/** Accès rapide sous le bandeau d'accueil : les catégories d'offres, puis les partenaires et « Divers ». */
const QUICK_LINKS: { href: string; label: string; icon: LucideIcon; tone: string }[] = [
  ...(['PARCS', 'CINEMA', 'VOYAGES', 'SPORT', 'EPICERIE', 'PARFUMERIE'] as const).map((category) => ({
    href: `/offres?categorie=${category}`,
    label: OFFER_CATEGORY_LABELS[category],
    icon: CATEGORY_ICONS[category],
    tone: CATEGORY_TONES[category],
  })),
  { href: '/partenaires', label: 'Partenaires', icon: Handshake, tone: 'bg-blue-600 text-white' },
  {
    href: '/offres?categorie=AUTRE',
    label: OFFER_CATEGORY_LABELS.AUTRE,
    icon: CATEGORY_ICONS.AUTRE,
    tone: CATEGORY_TONES.AUTRE,
  },
]

const STEPS = [
  {
    title: 'Cliquez sur « Adhérer »',
    text: 'Le bouton vous mène à la page d’adhésion de l’Amicale sur HelloAsso.',
  },
  {
    title: 'Réglez votre cotisation',
    text: 'Remplissez le formulaire et payez en ligne, de façon sécurisée.',
  },
  {
    title: 'Profitez des offres',
    text: 'Billetterie et sorties à tarifs négociés : commandez depuis la fiche de chaque offre.',
  },
] as const

export default async function HomePage() {
  const [{ rows: latestNews }, offers, highlights] = await Promise.all([
    listPublishedNews({ limit: 3 }),
    listPublishedOffers(),
    listActiveHighlights(),
  ])
  const now = new Date()
  const today = parisDay(now)
  const showcase = offers
    .map((offer) => ({ offer, availability: offerAvailability(offer, offer.tariffs, now, today) }))
    .filter(({ availability }) => availability.open)
    .sort((a, b) => Number(b.offer.featured) - Number(a.offer.featured))
    .slice(0, 4)

  return (
    <>
      {/* ─── Ouverture : bandeau tricolore (dégradé bleu, blanc, rouge) ─── */}
      <section data-surface="dark" className="relative overflow-hidden text-white hero-tricolore">
        <div className="relative mx-auto grid max-w-page items-center gap-6 px-4 pt-8 pb-12 sm:px-6 md:pt-10 md:pb-20 lg:grid-cols-2 lg:px-8">
          <div className="flex flex-col gap-5">
            <Eyebrow tone="onDark" as="h1">
              {site.legalName}
            </Eyebrow>
            <p className="max-w-lg text-lead text-blue-100">
              Billetterie à tarifs adhérents, sorties, avantages partenaires : l’{site.shortName} simplifie
              les loisirs des personnels de police du département et fait vivre les liens entre collègues.
            </p>
            <div className="flex flex-wrap gap-3">
              <JoinLink variant="inverse">Adhérer à l’Amicale</JoinLink>
              <ButtonLink href="/offres" variant="outlineInverse">
                Voir les offres
              </ButtonLink>
            </div>
            <MemberCount className="text-blue-100" />
          </div>

          {/* Le « 95 » du département, posé sur la bande blanche du drapeau. */}
          <div
            aria-hidden
            className="hidden justify-self-center text-center select-none lg:block lg:translate-x-8"
          >
            <p className="font-display text-[7rem] leading-none font-black tracking-tighter text-flag-blue">
              95
            </p>
            <p className="mt-2 label-caps text-ink">{site.department.name}</p>
          </div>
        </div>
      </section>

      {/* ─── Accès rapide aux catégories, à cheval sur le bandeau ─── */}
      <nav
        aria-labelledby="acces-rapide"
        className="relative z-10 mx-auto max-w-page px-4 pt-6 sm:px-6 md:-mt-12 md:pt-0 lg:px-8"
      >
        <div className="rounded-lg bg-surface p-4 shadow-overlay sm:p-5">
          <h2 id="acces-rapide" className="mb-3 font-display text-lead font-extrabold">
            Que cherchez-vous ?
          </h2>
          <ul className="grid grid-cols-4 gap-2 lg:grid-cols-8">
            {QUICK_LINKS.map(({ href, label, icon: Icon, tone }) => {
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex h-full flex-col items-center gap-1.5 rounded-md border border-line px-1 py-2.5 text-center transition-colors hover:border-blue-600 hover:bg-blue-50 sm:gap-2"
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-full sm:size-10 ${tone}`}
                    >
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="text-xs leading-tight font-semibold group-hover:text-blue-600 sm:text-sm">
                      {label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* ─── À la une : posts du bureau, défilement automatique ─── */}
      {highlights.length > 0 ? (
        <div className="pt-8 pb-16">
          <HighlightsMarquee items={highlights} fullBleed />
        </div>
      ) : null}

      {/* ─── Ce que l'adhésion apporte ─────────────────────────────── */}
      <section aria-labelledby="avantages-titre" className="bg-surface">
        <div className="mx-auto grid max-w-page gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
          <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
            <Eyebrow>L’adhésion</Eyebrow>
            <h2 id="avantages-titre" className="text-h2">
              Ce que l’Amicale vous apporte.
            </h2>
          </div>
          <ol className="flex flex-col">
            {BENEFITS.map((benefit, index) => (
              <li
                key={benefit.title}
                className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-line py-8 first:border-t-0 first:pt-0 sm:grid-cols-[5rem_1fr]"
              >
                <span aria-hidden className="font-display text-h2 font-black text-blue-600 tabular">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex max-w-prose flex-col gap-2">
                  <h3 className="text-h3">{benefit.title}</h3>
                  <p className="text-ink-muted">{benefit.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Offres du moment ─── */}
      {showcase.length > 0 ? (
        <section aria-labelledby="offres-titre">
          <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex max-w-prose flex-col gap-4">
                <Eyebrow>Billetterie</Eyebrow>
                <h2 id="offres-titre" className="text-h2">
                  Les offres du moment
                </h2>
              </div>
              <Link href="/offres" className="inline-flex items-center gap-2 font-semibold link">
                Toute la billetterie <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.map(({ offer, availability }) => (
                <li key={offer.id}>
                  <OfferCard
                    offer={offer}
                    availability={availability}
                    href={`/offres/${offer.slug}`}
                    hidePrices={!offer.pricesPublic}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ─── Parcours d'adhésion ───────────────────────────────────── */}
      <section aria-labelledby="etapes-titre" className="bg-surface/60">
        <div className="mx-auto flex max-w-page flex-col gap-12 px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-prose flex-col gap-4">
              <Eyebrow>Adhérer</Eyebrow>
              <h2 id="etapes-titre" className="text-h2">
                Trois étapes, entièrement en ligne.
              </h2>
            </div>
            <Link href="/adherer" className="inline-flex items-center gap-2 font-semibold link">
              Tout savoir sur l’adhésion <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-600 font-display text-lead font-extrabold text-white tabular">
                    {index + 1}
                  </span>
                  <span aria-hidden className="brand-rule flex-1" />
                </div>
                <h3 className="text-h3">{step.title}</h3>
                <p className="text-ink-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          <div>
            <JoinLink>Adhérer à l’Amicale</JoinLink>
          </div>
        </div>
      </section>

      {/* ─── Actualités (affichées uniquement si des articles sont publiés) ─── */}
      {latestNews.length > 0 ? (
        <section aria-labelledby="actualites-titre">
          <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4">
                <Eyebrow>La vie de l’Amicale</Eyebrow>
                <h2 id="actualites-titre" className="text-h2">
                  Dernières actualités
                </h2>
              </div>
              <Link href="/actualites" className="inline-flex items-center gap-2 font-semibold link">
                Toutes les actualités <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <NewsList items={latestNews} headingLevel="h3" />
          </div>
        </section>
      ) : null}

      {/* ─── Contact ───────────────────────────────────────────────── */}
      <section data-surface="dark" aria-labelledby="contact-titre" className="bg-rose-600 text-white">
        <div className="mx-auto flex max-w-page flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex flex-col gap-2">
            <h2 id="contact-titre" className="text-h2">
              Une question ? Le bureau vous répond.
            </h2>
            <p className="text-lead">Adhésion, commande, partenariat : écrivez-nous.</p>
          </div>
          <ButtonLink href="/contact" variant="inverse">
            Contacter le bureau
          </ButtonLink>
        </div>
      </section>
    </>
  )
}
