import type { Metadata } from 'next'
import { site } from '@/config/site'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { Eyebrow, PageHeader } from '@/components/ui/page-header'
import { JoinLink } from '@/features/settings/components/join-link'
import { getSiteSettings } from '@/features/settings/queries'

export const metadata: Metadata = {
  title: 'Adhérer',
  description: `Comment adhérer à l'${site.legalName} : adhésion et cotisation en ligne sur HelloAsso.`,
  alternates: { canonical: '/adherer' },
}

const STEPS = [
  {
    title: 'Vous cliquez sur « Adhérer en ligne »',
    text: 'Le bouton vous mène à la page d’adhésion de l’Amicale sur HelloAsso, la plateforme de paiement utilisée par l’association.',
  },
  {
    title: 'Vous remplissez le formulaire',
    text: 'Vos coordonnées et votre situation, telles que demandées par le bureau sur HelloAsso.',
  },
  {
    title: 'Vous réglez votre cotisation',
    text: 'Le paiement se fait en ligne, de façon sécurisée. HelloAsso vous envoie une confirmation par email.',
  },
  {
    title: 'Vous profitez des offres',
    text: 'Billetterie et sorties à tarifs négociés : commandez depuis la fiche de chaque offre.',
  },
] as const

/** Situations ouvrant droit à l'adhésion, telles que présentées jusqu'ici sur le site. */
const SITUATIONS = [
  'Personnel actif',
  'Retraité·e',
  'Personnel administratif, technique ou scientifique',
  'Autre situation',
] as const

export default async function JoinPage() {
  const { membershipUrl } = await getSiteSettings()
  return (
    <div className="mx-auto flex max-w-page flex-col gap-16 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader
        eyebrow="Adhérer"
        title="Rejoindre l’Amicale"
        lead={`L’${site.shortName} rassemble les personnels de police du ${site.department.name}. L’adhésion et la cotisation se font en ligne, sur HelloAsso.`}
        actions={membershipUrl ? <JoinLink>Adhérer en ligne</JoinLink> : null}
      />
      {!membershipUrl ? (
        <Alert tone="info" title="L’adhésion en ligne ouvre bientôt.">
          En attendant, <Link href="/contact">écrivez au bureau</Link> pour adhérer.
        </Alert>
      ) : null}

      <section aria-labelledby="parcours" className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-4">
          <Eyebrow>Le parcours</Eyebrow>
          <h2 id="parcours" className="text-h2">
            L’adhésion en ligne
          </h2>
        </div>
        <ol className="relative flex flex-col gap-10 border-l-4 border-blue-500 pl-8">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative flex flex-col gap-2">
              <span
                aria-hidden
                className="absolute top-0 -left-13 grid size-9 place-items-center rounded-full bg-blue-600 font-display font-extrabold text-white tabular"
              >
                {index + 1}
              </span>
              <h3 className="text-h3">{step.title}</h3>
              <p className="max-w-prose text-ink-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="situations"
        className="grid gap-10 rounded-lg bg-surface p-8 md:p-12 lg:grid-cols-[1fr_2fr]"
      >
        <div className="flex flex-col gap-4">
          <Eyebrow>Qui peut adhérer</Eyebrow>
          <h2 id="situations" className="text-h2">
            Les situations proposées
          </h2>
        </div>
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {SITUATIONS.map((situation) => (
              <li key={situation} className="py-3.5 font-semibold">
                {situation}
              </li>
            ))}
          </ul>
          <p className="max-w-prose text-ink-muted">
            Les conditions d’adhésion sont fixées par les statuts de l’association. En cas de doute sur votre
            situation, écrivez au bureau.
          </p>
          {site.membership.feeLabel ? (
            <p className="text-lead">
              Cotisation : <strong>{site.membership.feeLabel}</strong>
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
