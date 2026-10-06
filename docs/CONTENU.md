# Informations à fournir par le bureau

Le site n'invente aucune donnée métier. Les informations ci-dessous sont nécessaires avant la mise en ligne. Tant qu'un champ n'est pas renseigné dans `src/config/site.ts`, il n'est simplement pas affiché.

## Identité

- [x] Logo officiel reçu (JPEG sur fond blanc), intégré dans l'en-tête.
- [ ] Idéalement : version vectorielle (SVG) ou PNG transparent, et une variante pour fond sombre (pied de page).
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

## HelloAsso

- [x] Lien de la page HelloAsso d'adhésion 2026 (renseigné ; à changer chaque année dans **Espace bureau → Réglages**).
- [ ] Facultatif : lien de la page HelloAsso de chaque offre → champ « Lien HelloAsso de paiement » de l'offre.
- [ ] Adresse qui reçoit un email à chaque commande → **Espace bureau → Réglages**.

## Adhésion

- [ ] Conditions d'adhésion selon les statuts (la page « Adhérer » liste : personnel actif, retraité·e, personnel administratif, technique ou scientifique, autre situation — à valider).
- [ ] Montant et périodicité de la cotisation → `site.membership.feeLabel`

## Commandes

- [ ] Modalités de règlement des offres sans lien HelloAsso (le bureau recontacte la personne par email).

## Données personnelles

- [ ] Personne à contacter pour les demandes RGPD (si différente du bureau).
- [ ] Durées de conservation souhaitées (commandes, messages).

## Contenus

- [ ] Premières actualités, offres et partenaires, saisis depuis l'espace bureau.
- [ ] Photos réelles de l'Amicale, si le bureau souhaite en ajouter (aucune photo d'illustration générique n'a été utilisée).
