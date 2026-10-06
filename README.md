# ADPVO — Amicale des Policiers du Val d'Oise

Plateforme web de l'Amicale, pensée comme un site de CSE. **Les adhérents n'ont pas de compte** : seuls les membres du bureau se connectent, pour administrer le site.

- **site public** : présentation, catalogue des offres (`/offres`, tarifs affichés ou non au choix du bureau pour chaque offre), adhésion, actualités, contact (formulaire et bouton WhatsApp), pages légales ;
- **espace bureau** : commandes (règlement, export CSV), réglages (lien HelloAsso d'adhésion, adresse qui reçoit les commandes), offres et tarifs, posts « À la une », actualités, partenaires, messages, journal d'audit.

**Adhésion.** Les boutons « Adhérer » mènent à la page HelloAsso d'adhésion renseignée par le bureau
(**Espace bureau → Réglages**) ; tant qu'elle ne l'est pas, ils mènent à la page « Adhérer » du site.

**Commandes.** Chaque offre a un bouton « Commander » qui mène à un formulaire (nom, prénom, email).
La commande est enregistrée, un email est envoyé à l'adresse choisie dans **Réglages** (à défaut,
`BUREAU_EMAIL`), et le bureau la retrouve dans **Espace bureau → Commandes** (marquer comme réglée,
export CSV). Facultatif : si un lien HelloAsso est renseigné dans la fiche de l'offre, la personne y est
dirigée pour payer après sa commande. Le site ne voit aucune donnée bancaire. Les emails ne partent
réellement qu'avec un serveur d'envoi configuré (`MAIL_TRANSPORT=smtp`, voir `docs/EXPLOITATION.md`).

> ⚠️ **Avant la mise en production**, le bureau doit fournir les informations listées dans
> [`docs/CONTENU.md`](docs/CONTENU.md) : logo en fichier, coordonnées, mentions légales,
> modalités de règlement, etc. Aucune de ces informations n'a été inventée.

## Démonstration en ligne

[Déployer une démonstration sur Render](https://render.com/deploy?repo=https://github.com/romaindufraiche/amicale) : site et base créés automatiquement, données de démonstration chargées au premier démarrage (voir `docs/DEMO-EN-LIGNE.md`).

## Démarrage rapide

Prérequis : Node.js 22.12 ou plus, pnpm 10, PostgreSQL 16.

```bash
pnpm install
cp .env.example .env            # puis ajuster DATABASE_URL
createdb amicale
pnpm db:migrate                 # crée les tables
pnpm db:seed:demo               # données de démonstration (développement uniquement)
pnpm dev                        # http://localhost:3000
```

Compte de démonstration du bureau (mot de passe `demo-mot-de-passe`) :

| Compte              | Rôle                                   |
| ------------------- | -------------------------------------- |
| `bureau@demo.local` | administrateur (espace bureau complet) |

Le jeu de démonstration contient 17 offres **fictives** (cinéma, parcs, spectacles, sport, voyages, sorties de l'Amicale), 5 partenaires, 4 actualités et 3 commandes, toutes fictives. Aucune enseigne réelle n'est citée. Sans photo, chaque offre affiche un visuel de sa catégorie ; pour ajouter une vraie photo, glissez-déposez-la dans le formulaire de l'offre (espace bureau).

En développement, les emails ne sont pas envoyés : ils sont écrits en JSON dans `.outbox/` (liens de confirmation, de réinitialisation, etc.).

Pour créer le premier administrateur réel :

```bash
pnpm admin:create --email president@exemple.fr --first-name Prénom --last-name Nom
```

## Commandes

| Commande                    | Rôle                                                          |
| --------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                  | serveur de développement                                      |
| `pnpm build` / `pnpm start` | build de production (serveur autonome) et démarrage           |
| `pnpm lint`                 | ESLint                                                        |
| `pnpm typecheck`            | TypeScript strict                                             |
| `pnpm format`               | Prettier                                                      |
| `pnpm test`                 | tests unitaires et d'intégration (PostgreSQL requis)          |
| `pnpm test:e2e`             | tests de bout en bout Playwright sur le build de production   |
| `pnpm db:generate`          | génère une migration SQL après modification du schéma         |
| `pnpm db:migrate`           | applique les migrations                                       |
| `pnpm admin:create`         | crée ou promeut un administrateur                             |
| `pnpm maintenance:cleanup`  | purge sessions expirées, jetons et compteurs (cron quotidien) |
| `pnpm check`                | lint + types + tests + build                                  |

Les tests utilisent la base `amicale_test` (et `amicale_e2e` pour Playwright), configurables via `TEST_DATABASE_URL` et `E2E_DATABASE_URL`.

## Pile technique

Next.js 16 (App Router, React 19, Server Actions) · TypeScript strict · Tailwind CSS 4 (tokens de design) · PostgreSQL 16 + Drizzle ORM · Zod · Argon2id · Nodemailer · Vitest · Playwright + axe-core.

Choix justifiés dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) : organisation du code, flux de données, modèle de données, sécurité.
- [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) : identité visuelle, tokens, composants, règles d'usage.
- [`docs/DEMO-EN-LIGNE.md`](docs/DEMO-EN-LIGNE.md) : mettre le site en ligne gratuitement (Vercel + Neon) pour le faire tester.
- [`docs/EXPLOITATION.md`](docs/EXPLOITATION.md) : déploiement, variables d'environnement, sauvegardes, supervision.
- [`docs/CONTENU.md`](docs/CONTENU.md) : informations à fournir par le bureau avant la mise en ligne.

## Évolutions possibles

Non implémentées volontairement. Aucune n'est présentée comme disponible dans l'interface.

- Rapprochement automatique des paiements HelloAsso (API HelloAsso) : la commande passerait seule à « Réglée ».
- Double authentification (TOTP) pour les comptes du bureau.
