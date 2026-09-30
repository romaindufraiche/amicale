# Design system — ADPVO

## Source de vérité

Aucune charte graphique formelle n'a été fournie. La direction artistique découle de deux éléments :

1. **Le logo ADPVO** : sigle « ADP » en noir, « VO » en rouge, contour du Val d'Oise tracé d'un double trait bleu (épais + fin).
2. **La demande du client** : un rendu **moderne** aux **couleurs chaleureuses**.

D'où la direction retenue — revue à la demande du client pour un rendu plus vif : le **bleu police** comme couleur principale, le rouge du logo en accent (rappel bleu-blanc-rouge), l'ambre pour la chaleur, un noir chaud pour le texte, des neutres crème et sable pour la chaleur, et le double trait bleu du contour comme filet signature. Le logo n'est ni redessiné ni imité.

> **Logo** : fichier fourni par le client (`public/brand/logo-adpvo-original.jpeg`), marges blanches
> retirées dans `logo-adpvo.png`, déclaré dans `src/config/site.ts`. Fourni sur fond blanc, il est fondu
> dans le fond crème (`mix-blend-multiply`). Sur fond sombre (pied de page, carte d'adhérent), le sigle
> est composé en texte en attendant une version « négatif » du logo.

Tous les tokens sont définis dans `src/app/globals.css` (`@theme`). Les échelles par défaut de Tailwind sont **supprimées** : une couleur, une ombre ou un rayon qui n'est pas un token n'existe pas.

## Couleurs

| Token                      | Valeur                | Rôle                                                                                           |
| -------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `paper`                    | `#fbf7f0`             | fond de page (crème)                                                                           |
| `surface`                  | `#ffffff`             | panneaux, formulaires, cartes                                                                  |
| `sunken`                   | `#f4ecdf`             | zones en retrait (sable), talons de billets                                                    |
| `line` / `line-strong`     | `#e6dbca` / `#8f8270` | filets / bordures de champs (≥ 3:1)                                                            |
| `ink` / `ink-muted`        | `#1b1713` / `#5c5349` | texte (16,7:1) / texte secondaire (7:1)                                                        |
| `night-900…700`            | `#1f1a16`…            | surfaces sombres (pied de page, carte d'adhérent)                                              |
| `blue-600`                 | `#1a44bd`             | **couleur d'action** : boutons, liens actifs (blanc 8:1)                                       |
| `blue-700` / `blue-900`    | `#1737a0` / `#0f2a6e` | bandeau d'accueil / pied de page et carte d'adhérent                                           |
| `red-600`                  | `#d93128`             | accent (rouge « VO » du logo) : bandeau contact, trait des surtitres — rappel bleu-blanc-rouge |
| `red-700`                  | `#b5251d`             | survol, texte rouge sur fond clair (6:1)                                                       |
| `red-500`                  | `#f4433b`             | rouge du logo, **grands éléments uniquement** (« 95 », « VO »)                                 |
| `blue-500`                 | `#2f63e6`             | filet signature, focus clavier, icônes                                                         |
| `amber-300`                | `#ffc56a`             | accent chaleureux : économies, surtitres sur fond sombre                                       |
| `success/warning/danger-*` |                       | états fonctionnels, toujours accompagnés d'une icône ou d'un libellé                           |

Contrastes vérifiés (WCAG AA) et contrôlés automatiquement par axe-core dans les tests de bout en bout.

## Typographie

- **Archivo** (titres, boutons, libellés) : grotesque robuste et moderne, en graisse 800–900, proche des lettres géométriques épaisses du sigle.
- **Source Sans 3** (texte courant) : très lisible, chaleureuse.

Toutes deux auto-hébergées (`src/app/fonts/`, licence OFL) : aucune requête vers un service tiers.

| Token          | Taille                      | Usage                            |
| -------------- | --------------------------- | -------------------------------- |
| `text-display` | 5 → 13 rem (fluide)         | le « 95 », les grands chiffres   |
| `text-h1`      | 2,25 → 3,5 rem              | titre de page (un seul par page) |
| `text-h2`      | 1,75 → 2,25 rem             | titres de section                |
| `text-h3`      | 1,375 rem                   | sous-sections, titres de cartes  |
| `text-lead`    | 1,25 rem                    | chapôs                           |
| `text-base`    | 1,0625 rem (17 px)          | texte courant                    |
| `text-sm`      | 0,9375 rem                  | texte secondaire, tableaux       |
| `text-caption` | 0,8125 rem                  | mentions                         |
| `label-caps`   | caption, capitales espacées | surtitres, métadonnées, badges   |

Longueur de ligne limitée à `max-w-prose` (42 rem) pour la lecture.

## Formes, espacements, mouvement

- Rayons : `sm` 4 px (champs, boutons, badges) · `md` 8 px (cartes) · `lg` 16 px (grands blocs). Pas de boutons « pilule ».
- Ombres : `raised` (cartes interactives) et `overlay` (menus, survol). Rien d'autre.
- Espacements : échelle Tailwind (multiples de 4 px). Conteneurs : `narrow` 30 rem (formulaires de compte), `prose` 42 rem, `page` 76 rem.
- Mouvement : transitions de 150 ms sur les couleurs et soulignements, uniquement en réponse à une interaction. Aucune animation d'apparition. Seule animation continue : le bandeau « À la une », demandé par le client, avec contrôle de pause. `prefers-reduced-motion` respecté globalement.

## Motifs de marque

| Motif                              | Où                                                   | Pourquoi                                                 |
| ---------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| `brand-rule`                       | sous les en-têtes, au-dessus du pied de page, étapes | double trait du contour bleu du logo                     |
| Le « 95 »                          | accueil, 404                                         | identité départementale, en rouge du logo                |
| Billet perforé                     | catalogue de billetterie                             | fonctionnel : talon = prix, distingue ce qui se commande |
| Surtitre à trait rouge (`Eyebrow`) | en-têtes de sections                                 | repère de lecture constant                               |
| Carte d'adhérent                   | tableau de bord                                      | numéro et validité de cotisation d'un coup d'œil         |

## Composants

`src/components/ui/` : `Button` / `ButtonLink` (primary, secondary, ghost, inverse, danger · md, sm), `SubmitButton` (état d'envoi), `TextField`, `TextareaField`, `SelectField`, `CheckboxField` (libellé, aide, erreur reliés par ARIA), `Alert`, `FormMessage`, `Badge`, `PageHeader` / `Eyebrow`, `EmptyState`, `Table` / `Th` / `Td`, `Pagination`, `FilterBar`, `ActionForm`, `Prose`.

Chaque composant interactif gère ses états : survol, focus visible (anneau bleu), actif, désactivé, chargement. Chaque liste gère l'état vide ; chaque formulaire gère la validation, l'envoi, le succès et l'erreur.

## Règles

- Un seul `h1` par page ; hiérarchie des titres continue.
- Zones tactiles d'au moins 40 px (boutons `sm`) et 44–48 px pour la navigation et les boutons principaux.
- Le rouge `red-500` ne sert jamais au texte courant (contraste insuffisant) ; utiliser `red-700`.
- Les statuts (commande, adhésion) sont toujours écrits en toutes lettres, jamais signalés par la seule couleur.
- Pas de photos d'illustration génériques : si des visuels sont ajoutés, ce seront les photos réelles de l'Amicale.
