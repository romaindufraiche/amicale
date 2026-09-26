# Informations à fournir par le bureau

Le site n'invente aucune donnée métier. Les informations ci-dessous sont nécessaires avant la mise en ligne. Tant qu'un champ n'est pas renseigné dans `src/config/site.ts`, il n'est simplement pas affiché.

## Identité

- [x] Logo officiel reçu (JPEG sur fond blanc), intégré dans l'en-tête.
- [ ] Idéalement : version vectorielle (SVG) ou PNG transparent, et une variante pour fond sombre (pied de page, carte d'adhérent).
- [ ] **Dénomination exacte** selon les statuts (actuellement « Amicale des Policiers du Val d'Oise », d'après le logo).
- [ ] Forme juridique (actuellement « Association loi 1901 », à confirmer).

## Mentions légales (obligatoires)

- [ ] Numéro RNA (W95…) ou SIRET → `site.legal.registrationNumber`
- [ ] Nom du directeur ou de la directrice de la publication → `site.legal.publicationDirector`
- [ ] Hébergeur : nom, adresse, téléphone → `site.legal.host`
- [ ] Adresse du siège → `site.contact.postalAddress`

## Coordonnées

- [ ] Adresse email publique du bureau → `site.contact.email`
- [ ] Téléphone (facultatif) → `site.contact.phone`
- [ ] Horaires de permanence (facultatif) → `site.contact.officeHours`
- [ ] Adresse de réception des notifications (nouvelles demandes, messages) → variable `BUREAU_EMAIL`

## Adhésion

- [ ] Conditions d'adhésion selon les statuts (les situations proposées dans le formulaire sont : personnel actif, retraité·e, personnel administratif, technique ou scientifique, autre situation — à valider).
- [ ] Montant et périodicité de la cotisation → `site.membership.feeLabel`
- [ ] Règle de fin de cotisation (par défaut, le bureau propose le 31 décembre de l'année en cours lors de la validation).

## Commandes

- [ ] **Modalités de règlement** (IBAN, ordre des chèques, permanence…) → `site.paymentInstructions`. Sans elles, l'adhérent est informé que le bureau le contactera.

## Données personnelles

- [ ] Personne à contacter pour les demandes RGPD (si différente du bureau).
- [ ] Durées de conservation souhaitées (comptes inactifs, commandes, messages).

## Contenus

- [ ] Premières actualités, offres et partenaires, saisis depuis l'espace bureau.
- [ ] Photos réelles de l'Amicale, si le bureau souhaite en ajouter (aucune photo d'illustration générique n'a été utilisée).
