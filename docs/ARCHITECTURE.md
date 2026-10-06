# Architecture

## Principes

Un **monolithe modulaire** Next.js : une seule application, un seul déploiement, une seule base PostgreSQL. C'est proportionné à une association départementale. Pas de microservice, pas de file de messages, pas d'API publique séparée.

```
src/
├── app/                 Routes (pages, layouts, route handlers) : présentation uniquement
│   ├── (site)/          Site public + connexion du bureau
│   ├── admin/           Espace bureau
│   └── api/health/      Sonde de disponibilité
├── components/
│   ├── ui/              Primitives du design system (boutons, champs, alertes, tableaux…)
│   └── layout/          En-têtes, pieds de page, gabarits d'espaces
├── features/            Un dossier par domaine métier
│   └── <domaine>/
│       ├── schemas.ts   Validation Zod des entrées
│       ├── rules.ts     Règles métier pures (sans base), testées unitairement
│       ├── queries.ts   Lectures
│       ├── service.ts   Écritures : transactions, audit, emails
│       ├── actions.ts   Server Actions : validation → authentification → autorisation → service
│       └── components/  Composants propres au domaine
├── server/              Infrastructure serveur : base, sessions, emails, logs, limitation de débit
├── lib/                 Utilitaires purs (montants, dates, slug, CSV…)
├── config/site.ts       Informations institutionnelles (à renseigner par le bureau)
├── proxy.ts             CSP à nonce, identifiant de requête, cookie de session
└── instrumentation.ts   Journalisation des erreurs serveur non gérées
```

Domaines : `auth`, `offers`, `requests` (commandes), `settings`, `news`, `highlights`, `media`, `partners`, `contact`, `audit`.

## Flux d'une action

Toute écriture passe par une **Server Action** qui applique systématiquement :

```
FormData → Zod (validation) → requireUser / requirePermission (authentification + autorisation)
        → service (transaction PostgreSQL + journal d'audit) → email (après validation de la transaction)
        → revalidatePath / redirect
```

- Les gardes d'accès (`src/server/auth/guards.ts`) sont appelées **dans chaque page et chaque action** : une action serveur est un point d'entrée HTTP autonome, la protection d'un layout ne suffit pas.
- Les erreurs inattendues sont interceptées par `runFormAction` : journalisées avec leur contexte, remplacées côté utilisateur par un message compréhensible.
- Les formulaires renvoient leur saisie (hors mots de passe) en cas d'erreur, pour que rien ne soit perdu.

## Modèle de données

Défini dans `src/server/db/schema.ts`, migrations SQL versionnées dans `drizzle/`.

| Table                      | Rôle                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `users`                    | comptes du bureau uniquement (les adhérents n'ont pas de compte) : identité, rôle, statut   |
| `sessions`                 | sessions (empreinte SHA-256 du jeton, expiration glissante de 14 jours)                     |
| `user_tokens`              | liens de confirmation d'email et de réinitialisation (empreintes, usage unique)             |
| `rate_limits`              | compteurs de limitation de débit (partagés entre instances)                                 |
| `offers` / `offer_tariffs` | offres (billetterie ou sortie) et leurs tarifs, prix adhérent/public, stock                 |
| `offer_requests`           | commandes passées sur le site (offre, nom, prénom, email), règlement noté par le bureau     |
| `site_settings`            | réglages modifiables par le bureau (lien HelloAsso d'adhésion), une seule ligne             |
| `orders` / `order_lines`   | commandes, lignes avec libellé et prix **copiés** au moment de la commande                  |
| `media`                    | images téléversées (ré-encodées en WebP, métadonnées supprimées), servies par `/media/<id>` |
| `highlights`               | posts « À la une » du bandeau défilant                                                      |
| `partners`                 | avantages partenaires                                                                       |
| `news`                     | actualités                                                                                  |
| `contact_messages`         | messages du formulaire de contact                                                           |
| `audit_logs`               | journal des actions du bureau                                                               |

Conventions : montants en centimes (entiers), horodatages `timestamptz`, dates calendaires `YYYY-MM-DD` interprétées à l'heure de Paris, contraintes `CHECK` sur prix, stocks et quantités.

### Commandes

`features/requests/service.ts#submitOfferRequest` : l'offre est relue en base (publiée, ouverte, non complète),
la commande est enregistrée, un email part à l'adresse choisie dans les réglages (à défaut `BUREAU_EMAIL`),
puis le lien HelloAsso de l'offre, lu en base, est renvoyé s'il existe. Limitation à 10 commandes par heure
et par IP, champ piège anti-robot. Couvert par `tests/integration/requests.test.ts`.

## Sécurité

| Sujet                  | Mesure                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mots de passe          | Argon2id (paramètres OWASP), 12 caractères minimum, comparaison à temps constant y compris pour un compte inconnu                                                                           |
| Sessions               | jeton aléatoire 256 bits, seule l'empreinte est stockée ; cookie `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax` ; révocation au changement de mot de passe et à la désactivation du compte |
| Énumération de comptes | réponse identique au « mot de passe oublié », que l'adresse existe ou non                                                                                                                   |
| Force brute            | limitation par adresse (5 / 15 min) et par IP (30 / 15 min) à la connexion ; commandes, réinitialisation, contact et changement de mot de passe limités                                     |
| Autorisation           | matrice de droits `src/server/auth/permissions.ts`, vérifiée côté serveur ; pages bureau en 404 pour les non-habilités                                                                      |
| CSRF                   | Server Actions (vérification d'origine par Next.js) + cookies `SameSite=Lax`                                                                                                                |
| XSS                    | contenus saisis stockés en texte brut et rendus par React ; CSP stricte à nonce (`strict-dynamic`)                                                                                          |
| Redirections ouvertes  | paramètre `next` restreint aux chemins internes (`safeRedirectPath`)                                                                                                                        |
| En-têtes               | HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`                                                                                 |
| Export CSV             | protection contre l'injection de formules                                                                                                                                                   |
| Données personnelles   | aucune donnée de commande publique, pas de traceur tiers, polices auto-hébergées, logs sans secret ni jeton (y compris dans les URL)                                                        |
| Téléversement d'images | réservé au bureau, 8 Mo max, JPEG/PNG/WebP ; fichier décodé puis ré-encodé (un faux fichier image est rejeté, EXIF et GPS supprimés), 60 envois par heure au plus                           |
| Anti-spam              | champ piège + limitation par IP sur les formulaires de contact et de commande                                                                                                               |

## Choix techniques

- **Next.js App Router + Server Actions** : rendu serveur (SEO, performance), pas d'API REST à maintenir ni à sécuriser séparément. JavaScript client limité aux formulaires interactifs et au menu mobile.
- **Rendu dynamique** de toutes les pages : exigé par la CSP à nonce, et sans coût notable à cette échelle.
- **PostgreSQL + Drizzle** : transactions, SQL explicite, migrations versionnées et reproductibles.
- **Sessions en base plutôt que JWT** : révocables immédiatement (désactivation d'un compte).
- **Limitation de débit en base** : fonctionne avec plusieurs instances, sans Redis.
- **Aucune bibliothèque de composants** : le design system est spécifique à la marque (voir `DESIGN-SYSTEM.md`).
- **Environnement validé à l'exécution** (`src/server/env.ts`) : le build ne nécessite aucun secret.
