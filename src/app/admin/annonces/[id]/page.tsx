import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ActionForm } from '@/components/ui/action-form'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import {
  deleteClassifiedAction,
  deleteInterestAction,
  setInterestProcessedAction,
} from '@/features/classifieds/actions'
import { ClassifiedForm } from '@/features/classifieds/components/classified-form'
import { getClassifiedForAdmin, listInterestsForClassified } from '@/features/classifieds/queries'
import { classifiedExpiresAt } from '@/features/classifieds/labels'
import { Badge } from '@/components/ui/badge'
import { Table, Td, Th } from '@/components/ui/table'
import { formatDate, formatDateTime } from '@/lib/dates'
import { requirePermission } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Modifier une annonce' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enregistre?: string }> }

export default async function EditClassifiedPage({ params, searchParams }: Props) {
  const { id } = await params
  await requirePermission('classifieds:manage', `/admin/annonces/${id}`)
  const classifiedId = z.uuid().safeParse(id)
  const item = classifiedId.success ? await getClassifiedForAdmin(classifiedId.data) : null
  if (!item) notFound()
  const saved = (await searchParams).enregistre === '1'
  const interests = await listInterestsForClassified(item.id)

  return (
    <>
      <Link href="/admin/annonces" className="inline-flex items-center gap-2 self-start text-sm link">
        <ArrowLeft aria-hidden className="size-4" /> Annonces
      </Link>
      <PageHeader
        eyebrow="Annonces"
        title={item.title}
        actions={
          <ActionForm
            action={deleteClassifiedAction}
            fields={{ classifiedId: item.id }}
            label="Supprimer"
            variant="danger"
            size="md"
            confirm="Supprimer définitivement cette annonce ?"
          />
        }
      />
      {saved ? <Alert tone="success" title="Annonce enregistrée." /> : null}
      <p className="text-sm text-ink-muted">
        Publiée le {formatDate(item.createdAt)} · supprimée automatiquement le{' '}
        {formatDate(classifiedExpiresAt(item.createdAt))} (45 jours).
      </p>

      <section aria-labelledby="interesses" className="flex flex-col gap-4">
        <h2 id="interesses" className="text-h3">
          Personnes intéressées <span className="font-normal text-ink-muted">({interests.length})</span>
        </h2>
        {interests.length === 0 ? (
          <p className="text-ink-muted">Personne n’a encore cliqué sur « Cette annonce m’intéresse ».</p>
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              Vérifiez que la personne est adhérente à jour de cotisation, transmettez-lui les coordonnées du
              vendeur, puis marquez la demande comme traitée.
            </p>
            <Table caption="Personnes intéressées par cette annonce">
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Personne</Th>
                  <Th>Coordonnées</Th>
                  <Th>Suivi</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {interests.map((interest) => (
                  <tr key={interest.id} className="align-top">
                    <Td className="whitespace-nowrap tabular">{formatDateTime(interest.createdAt)}</Td>
                    <Td className="font-semibold">
                      {interest.lastName} {interest.firstName}
                    </Td>
                    <Td>
                      <p>
                        <a href={`mailto:${interest.email}`} className="break-all link">
                          {interest.email}
                        </a>
                      </p>
                      <p>
                        <a href={`tel:${interest.phone.replace(/[^\d+]/g, '')}`} className="link">
                          {interest.phone}
                        </a>
                      </p>
                    </Td>
                    <Td>
                      {interest.processedAt ? (
                        <Badge tone="success">Traitée le {formatDate(interest.processedAt)}</Badge>
                      ) : (
                        <Badge tone="danger">À traiter</Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-2">
                        {interest.processedAt ? (
                          <ActionForm
                            action={setInterestProcessedAction}
                            fields={{ interestId: interest.id, processed: '0' }}
                            label="Repasser à traiter"
                            variant="ghost"
                          />
                        ) : (
                          <ActionForm
                            action={setInterestProcessedAction}
                            fields={{ interestId: interest.id, processed: '1' }}
                            label="Marquer comme traitée"
                            variant="primary"
                          />
                        )}
                        <ActionForm
                          action={deleteInterestAction}
                          fields={{ interestId: interest.id }}
                          label="Supprimer"
                          variant="danger"
                          confirm={`Supprimer la demande de ${interest.firstName} ${interest.lastName} ?`}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </section>

      <h2 className="text-h3">Modifier l’annonce</h2>
      <ClassifiedForm
        key={item.updatedAt.toISOString()}
        initial={{
          id: item.id,
          kind: item.kind,
          title: item.title,
          description: item.description,
          imageId: item.imageId,
          image2Id: item.image2Id,
          pinned: item.pinned,
          published: item.published,
        }}
      />
    </>
  )
}
