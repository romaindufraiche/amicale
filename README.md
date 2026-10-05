# ADPVO — Amicale des Policiers du Val d'Oise

Plateforme web de l'Amicale, pensée comme un site de CSE :

- **site public** : présentation, catalogue des offres (`/offres`, tarifs affichés ou non au choix du bureau pour chaque offre), adhésion, actualités, contact (formulaire et bouton WhatsApp), pages légales ;
- **espace bureau** : demandes de commande (suivi des paiements, export CSV), réglages (lien HelloAsso d'adhésion), offres et tarifs (avec le lien HelloAsso de chaque offre), posts « À la une », actualités, partenaires, messages, journal d'audit.

**Adhésions et paiements sur HelloAsso.** Les boutons « Adhérer » mènent à la page HelloAsso d'adhésion
renseignée par le bureau (**Espace bureau → Réglages**). Pour commander une offre, la personne laisse
son nom, son prénom, son email et éventuellement son téléphone sur la fiche de l'offre, puis un bouton la
dirige vers la page HelloAsso de cette offre (lien renseigné dans la fiche de l'offre). Le bureau retrouve
toutes les demandes dans **Espace bureau → Demandes**, y compris celles qui n'ont pas abouti à un
paiement, et note les paiements constatés sur HelloAsso. Le site ne voit aucune donnée bancaire.

> L'ancien espace adhérent (comptes adhérents, commandes réglées hors ligne) n'est plus relié au site ;
> sa suppression complète du code et de la base est en attente de validation.

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

Comptes de démonstration (mot de passe `demo-mot-de-passe`) :

| Compte                | Rôle                                   |
| --------------------- | -------------------------------------- |
| `bureau@demo.local`   | administrateur (espace bureau complet) |
| `adherent@demo.local` | adhérent à jour de cotisation          |
| `demande@demo.local`  | demande d'adhésion en attente          |
| `retraite@demo.local` | seconde demande d'adhésion en attente  |

Le jeu de démonstration contient 17 offres **fictives** (cinéma, parcs, spectacles, sport, voyages, sorties de l'Amicale), 5 partenaires, 4 actualités et quelques commandes. Aucune enseigne réelle n'est citée. Sans photo, chaque offre affiche un visuel de sa catégorie ; pour ajouter une vraie photo, glissez-déposez-la dans le formulaire de l'offre (espace bureau).

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

- Paiement en ligne (HelloAsso, Stripe…) : webhook authentifié et idempotent, qui passe la commande à « Réglée ».
- Double authentification (TOTP) pour les comptes du bureau.
- Images des offres (téléversement contrôlé, recadrage, formats modernes).
- Renouvellement de cotisation en ligne.
