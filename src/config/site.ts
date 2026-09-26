/**
 * Informations institutionnelles de l'Amicale.
 *
 * ⚠️ Ces informations doivent être fournies et validées par le bureau.
 * Aucune donnée n'a été inventée : un champ à `null` n'est simplement pas affiché.
 * La liste des informations attendues figure dans `docs/CONTENU.md`.
 */
export const site = {
  /** Sigle, utilisé dans l'en-tête, les emails et les titres de page (repris du logo). */
  shortName: 'ADPVO',
  /** Dénomination telle qu'elle figure sur le logo — à confirmer avec les statuts. */
  legalName: "Amicale des Policiers du Val d'Oise",
  department: { code: '95', name: "Val d'Oise" },
  description:
    "L'Amicale des Policiers du Val d'Oise : billetterie à tarifs adhérents, sorties, avantages partenaires et vie de l'association.",

  /**
   * Logo officiel ADPVO (dimensions intrinsèques du fichier, en pixels).
   * `logo-adpvo.png` est le fichier fourni (`logo-adpvo-original.jpeg`), marges blanches retirées.
   * À `null`, l'en-tête afficherait le sigle en texte.
   */
  logo: { src: '/brand/logo-adpvo.png', width: 1452, height: 806 } as {
    src: string
    width: number
    height: number
  } | null,

  /** Coordonnées publiques (affichées sur la page Contact et les mentions légales). */
  contact: {
    email: null as string | null,
    /** Numéro WhatsApp de l'Amicale, au format international. */
    whatsapp: '+33 7 68 16 98 67' as string | null,
    phone: null as string | null,
    postalAddress: null as string | null,
    /** Horaires de permanence, en texte libre. */
    officeHours: null as string | null,
  },

  /** Mentions légales (loi n° 2004-575 du 21 juin 2004, art. 6). */
  legal: {
    legalForm: 'Association loi 1901',
    /** Numéro RNA (W951…) ou SIRET. */
    registrationNumber: null as string | null,
    publicationDirector: null as string | null,
    host: null as { name: string; address: string; phone: string | null } | null,
  },

  /** Adhésion : montant et période de la cotisation, tels que fixés par le bureau. */
  membership: {
    /** Ex. « 20 € par an ». Non affiché tant qu'il n'est pas renseigné. */
    feeLabel: null as string | null,
  },

  /**
   * Modalités de règlement des commandes, affichées après une commande.
   * Tant qu'elles ne sont pas renseignées, l'adhérent est informé que le bureau
   * le contactera pour le règlement.
   */
  paymentInstructions: null as string | null,
} as const

export type SiteConfig = typeof site
