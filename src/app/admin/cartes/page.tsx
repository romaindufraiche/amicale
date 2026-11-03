import { Download, Printer } from 'lucide-react'
import type { Metadata } from 'next'
import { z } from 'zod'
import { ActionForm } from '@/components/ui/action-form'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Table, Td, Th } from '@/components/ui/table'
import { deleteMemberAction } from '@/features/member-cards/actions'
import { CardGenerator } from '@/features/member-cards/components/card-generator'
import { CardPreview } from '@/features/member-cards/components/card-preview'
import { formatMemberNumber } from '@/features/member-cards/schemas'
import { listMembers } from '@/features/member-cards/service'
import { getSiteSettings } from '@/features/settings/queries'
import { formatShortDate } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Cartes d’adhérent' }

type Props = { searchParams: Promise<Record<string, string | undefined>> }

export default async function MemberCardsPage({ searchParams }: Props) {
  await requirePermission('cards:generate', '/admin/cartes')
  const params = await searchParams
  const [{ cardSeason }, members] = await Promise.all([getSiteSettings(), listMembers()])
  const highlighted = z.uuid().safeParse(params.carte)
  const issued = highlighted.success ? members.find((member) => member.id === highlighted.data) : undefined
  const pdfHref = (id: string, format: 'carte' | 'a4') => `/admin/cartes/${id}/pdf?format=${format}`

  return (
    <>
      <PageHeader
        eyebrow="Espace bureau"
        title="Cartes d’adhérent"
        lead="Saisissez le nom et le prénom de l’adhérent : sa carte reçoit un numéro et rejoint le listing. Téléchargez-la ensuite en PDF pour l’imprimer ou l’envoyer à l’adhérent."
        actions={
          <a href="/admin/cartes/export" className={buttonClasses('secondary', 'sm')}>
            <Download aria-hidden className="size-4" /> Exporter le listing (CSV)
          </a>
        }
      />

      {issued ? (
        <section
          aria-labelledby="carte-creee"
          className="flex flex-col gap-5 rounded-lg border border-line bg-success-50 p-6 lg:flex-row lg:items-center lg:gap-10"
        >
          <CardPreview
            lastName={issued.lastName}
            firstName={issued.firstName}
            season={issued.season}
            number={issued.number}
          />
          <div className="flex flex-col gap-3">
            <h2 id="carte-creee" className="text-h3">
              {params.renouvelee
                ? `Carte renouvelée : ${issued.firstName} ${issued.lastName.toLocaleUpperCase('fr-FR')} garde le N° ${formatMemberNumber(issued.number)}`
                : `Carte créée : N° ${formatMemberNumber(issued.number)}`}
            </h2>
            <div className="flex flex-wrap gap-3">
              <a href={pdfHref(issued.id, 'carte')} className={buttonClasses('primary', 'md')}>
                <Download aria-hidden className="size-4" /> Carte seule (PDF)
              </a>
              <a href={pdfHref(issued.id, 'a4')} className={buttonClasses('secondary', 'md')}>
                <Printer aria-hidden className="size-4" /> Page A4 à découper
              </a>
            </div>
            <p className="text-sm text-ink-muted">
              Téléchargez la carte puis envoyez-la à l’adhérent (email, WhatsApp…) ou imprimez-la.
            </p>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="nouvelle-carte" className="flex flex-col gap-5">
        <h2 id="nouvelle-carte" className="text-h3">
          Nouvelle carte
        </h2>
        <CardGenerator season={cardSeason} />
      </section>

      <section aria-labelledby="listing" className="flex flex-col gap-5">
        <h2 id="listing" className="text-h3">
          Listing des adhérents <span className="font-normal text-ink-muted">({members.length})</span>
        </h2>
        {members.length === 0 ? (
          <EmptyState title="Aucun adhérent pour le moment">
            Chaque carte créée ajoute l’adhérent ici, avec son numéro.
          </EmptyState>
        ) : (
          <Table caption="Listing des adhérents">
            <thead>
              <tr>
                <Th>N°</Th>
                <Th>Nom</Th>
                <Th>Prénom</Th>
                <Th>Saison</Th>
                <Th>Ajouté le</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="align-top">
                  <Td className="font-semibold tabular">{formatMemberNumber(member.number)}</Td>
                  <Td className="font-semibold">{member.lastName.toLocaleUpperCase('fr-FR')}</Td>
                  <Td>{member.firstName}</Td>
                  <Td>{member.season}</Td>
                  <Td className="tabular">{formatShortDate(member.createdAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <a href={pdfHref(member.id, 'carte')} className={buttonClasses('ghost', 'sm')}>
                        <Download aria-hidden className="size-4" /> PDF
                        <span className="sr-only">
                          {' '}
                          : carte de {member.firstName} {member.lastName}
                        </span>
                      </a>
                      <a href={pdfHref(member.id, 'a4')} className={buttonClasses('ghost', 'sm')}>
                        <Printer aria-hidden className="size-4" /> A4
                        <span className="sr-only">
                          {' '}
                          : carte de {member.firstName} {member.lastName}
                        </span>
                      </a>
                      <ActionForm
                        action={deleteMemberAction}
                        fields={{ memberId: member.id }}
                        label="Retirer"
                        variant="danger"
                        confirm={`Retirer ${member.firstName} ${member.lastName} (N° ${formatMemberNumber(member.number)}) du listing ?`}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </>
  )
}
