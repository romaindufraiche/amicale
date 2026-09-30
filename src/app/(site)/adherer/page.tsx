import type { Metadata } from 'next'
import { site } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
import { Eyebrow, PageHeader } from '@/components/ui/page-header'
import { MEMBER_CATEGORIES, MEMBER_CATEGORY_LABELS } from '@/features/members/categories'

export const metadata: Metadata = {
  title: 'Adhérer',
  description: `Comment adhérer à l'${site.legalName} : demande en ligne, confirmation de l’email et validation par le bureau.`,
  alternates: { canonical: '/adherer' },
}

const STEPS = [
  {
    title: 'Vous remplissez la demande en ligne',
    text: 'Identité, situation, service d’affectation et mot de passe. Aucune pièce justificative n’est demandée en ligne.',
  },
  {
    title: 'Vous confirmez votre adresse email',
    text: 'Un lien vous est envoyé immédiatement. Tant qu’il n’est pas utilisé, votre demande n’est pas transmise.',
  },
  {
    title: 'Le bureau examine votre demande',
    text: 'Il peut vous contacter pour la compléter. Une fois votre adhésion validée, vous recevez votre numéro d’adhérent par email.',
  },
  {
    title: 'Vous accédez à votre espace',
    text: 'Billetterie, sorties, avantages partenaires et suivi de vos commandes, tant que votre cotisation est à jour.',
  },
] as const

export default function JoinPage() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-16 px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <PageHeader
        eyebrow="Adhérer"
        title="Rejoindre l’Amicale"
        lead={`L’${site.shortName} rassemble les personnels de police du ${site.department.name}. Chaque demande est examinée par le bureau de l’association.`}
        actions={<ButtonLink href="/inscription">Faire ma demande</ButtonLink>}
      />

      <section aria-labelledby="parcours" className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-4">
          <Eyebrow>Le parcours</Eyebrow>
          <h2 id="parcours" className="text-h2">
            De la demande à l’accès
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
            {MEMBER_CATEGORIES.map((category) => (
              <li key={category} className="py-3.5 font-semibold">
                {MEMBER_CATEGORY_LABELS[category]}
              </li>
            ))}
          </ul>
          <p className="max-w-prose text-ink-muted">
            Les conditions d’adhésion sont fixées par les statuts de l’association. En cas de doute sur votre
            situation, déposez votre demande ou écrivez au bureau.
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
