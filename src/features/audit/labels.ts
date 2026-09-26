/** Libellés lisibles des actions tracées dans le journal. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'member.approved': 'Adhésion validée',
  'member.rejected': 'Demande refusée',
  'member.suspended': 'Compte suspendu',
  'member.reactivated': 'Compte réactivé',
  'member.membership_renewed': 'Cotisation mise à jour',
  'member.role_changed': 'Rôle modifié',
  'offer.created': 'Offre créée',
  'offer.updated': 'Offre modifiée',
  'offer.status_changed': 'Statut d’offre modifié',
  'order.status_changed': 'Statut de commande modifié',
  'orders.exported': 'Commandes exportées',
  'news.created': 'Actualité créée',
  'news.updated': 'Actualité modifiée',
  'news.status_changed': 'Statut d’actualité modifié',
  'partner.created': 'Partenaire ajouté',
  'partner.updated': 'Partenaire modifié',
  'contact.handled': 'Message traité',
  'highlight.created': 'Post « À la une » créé',
  'highlight.updated': 'Post « À la une » modifié',
  'highlight.deleted': 'Post « À la une » supprimé',
}

const ENTITY_PATHS: Record<string, string> = {
  user: '/admin/adherents/',
  offer: '/admin/offres/',
  news: '/admin/actualites/',
  partner: '/admin/partenaires/',
  highlight: '/admin/a-la-une/',
}

export function auditEntityHref(entityType: string, entityId: string | null): string | null {
  const base = ENTITY_PATHS[entityType]
  return base && entityId ? `${base}${entityId}` : null
}
