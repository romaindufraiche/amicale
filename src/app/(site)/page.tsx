import { ArrowRight } from 'lucide-react'
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
import { getCurrentSession } from '@/server/auth/session'

const BENEFITS = [
  {
    title: 'Billetterie à tarifs adhérents',
    text: 'Cinéma, parcs de loisirs, spectacles, sport : commandez vos billets en ligne depuis votre espace, au prix négocié par l’Amicale.',
  },
  {
    title: 'Sorties et événements',
    text: 'Les sorties organisées par l’Amicale sont annoncées dans votre espace. Inscrivez-vous en quelques clics, dans la limite des places disponibles.',
  },
  {
    title: 'Avantages partenaires',
    text: 'Les réductions et conditions préférentielles obtenues auprès des partenaires de l’Amicale, réunies au même endroit et réservées aux adhérents.',
  },
] as const

/** Catégories proposées en accès rapide sous le bandeau d'accueil. */
const QUICK_CATEGORIES = ['CINEMA', 'PARCS', 'SPECTACLES', 'SPORT', 'VOYAGES', 'FAMILLE'] as const

const STEPS = [
  { title: 'Créez votre compte', text: 'Renseignez votre situation et votre service en quelques minutes.' },
  { title: 'Confirmez votre email', text: 'Un lien de confirmation vous est envoyé immédiatement.' },
  { title: 'Validation par le bureau', text: 'Le bureau examine votre demande et active votre adhésion.' },
] as const

export default async function HomePage() {
  const session = await getCurrentSession()
  const isMember = session?.user.status === 'ACTIVE'
  const [{ rows: latestNews }, offers, highlights] = await Promise.all([
    listPublishedNews({ includeMembersOnly: false, limit: 3 }),
    listPublishedOffers(),
    listActiveHighlights({ includeMembersOnly: isMember }),
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
        <div className="relative mx-auto grid max-w-page items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-20 md:pb-28 lg:grid-cols-2 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-7">
            <Eyebrow tone="onDark">{site.legalName}</Eyebrow>
            <h1 className="max-w-[16ch] text-h1">
              L’amicale de celles et ceux qui veillent sur le Val d’Oise.
            </h1>
            <p className="max-w-lg text-lead text-blue-100">
              Billetterie à tarifs adhérents, sorties, avantages partenaires : l’{site.shortName} simplifie
              les loisirs des personnels de police du département et fait vivre les liens entre collègues.
            </p>
            <div className="flex flex-wrap gap-3">
              {session ? (
                <ButtonLink href="/espace" variant="inverse">
                  Accéder à mon espace
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/inscription" variant="inverse">
                    Devenir adhérent
                  </ButtonLink>
                  <ButtonLink href="/connexion" variant="outlineInverse">
                    Se connecter
                  </ButtonLink>
                </>
              )}
            </div>
          </div>

          {/* Le « 95 » du département, posé sur la bande blanche du drapeau. */}
          <div
            aria-hidden
            className="hidden justify-self-center text-center select-none lg:block lg:translate-x-8"
          >
            <p className="font-display text-display font-black tracking-tighter text-flag-blue">95</p>
            <p className="mt-2 label-caps text-ink">{site.department.name}</p>
          </div>
        </div>
      </section>

      {/* ─── Accès rapide aux catégories, à cheval sur le bandeau ─── */}
      <nav
        aria-labelledby="acces-rapide"
        className="relative z-10 mx-auto max-w-page px-4 pt-8 sm:px-6 md:-mt-16 md:pt-0 lg:px-8"
      >
        <div className="rounded-lg bg-surface p-5 shadow-overlay sm:p-6">
          <h2 id="acces-rapide" className="mb-4 font-display text-lead font-extrabold">
            Que cherchez-vous ?
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category]
              return (
                <li key={category}>
                  <Link
                    href={`${isMember ? '/espace/billetterie' : '/offres'}?categorie=${category}`}
                    className="group flex h-full items-center gap-3 rounded-md border border-line p-3 transition-colors hover:border-blue-600 hover:bg-blue-50"
                  >
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-full ${CATEGORY_TONES[category]}`}
                    >
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="leading-tight font-semibold group-hover:text-blue-600">
                      {OFFER_CATEGORY_LABELS[category]}
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
        <div className="py-16">
          <HighlightsMarquee items={highlights} fullBleed />
        </div>
      ) : null}

      {/* ─── Ce que l'adhésion apporte ─────────────────────────────── */}
      <section aria-labelledby="avantages-titre" className="bg-surface">
        <div className="mx-auto grid max-w-page gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
          <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
            <Eyebrow>L’adhésion</Eyebrow>
            <h2 id="avantages-titre" className="text-h2">
              Tout ce que l’Amicale vous ouvre, dans un seul espace.
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

      {/* ─── Offres du moment (visibles de tous, commande réservée aux adhérents) ─── */}
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
              <Link
                href={isMember ? '/espace/billetterie' : '/offres'}
                className="inline-flex items-center gap-2 font-semibold link"
              >
                Toute la billetterie <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.map(({ offer, availability }) => (
                <li key={offer.id}>
                  <OfferCard
                    offer={offer}
                    availability={availability}
                    href={`${isMember ? '/espace/billetterie' : '/offres'}/${offer.slug}`}
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
          {!session ? (
            <div>
              <ButtonLink href="/inscription">Commencer mon adhésion</ButtonLink>
            </div>
          ) : null}
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
