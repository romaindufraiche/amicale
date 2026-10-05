# Architecture

## Principes

Un **monolithe modulaire** Next.js : une seule application, un seul déploiement, une seule base PostgreSQL. C'est proportionné à une association départementale de quelques centaines à quelques milliers d'adhérents. Pas de microservice, pas de file de messages, pas d'API publique séparée.

```
src/
├── app/                 Routes (pages, layouts, route handlers) : présentation uniquement
│   ├── (site)/          Site public + pages de compte (connexion, inscription…)
│   ├── espace/          Espace adhérent
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

Domaines : `auth`, `members`, `offers`, `orders`, `news`, `highlights`, `media`, `partners`, `contact`, `audit`.

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
| `users`                    | comptes : identité, situation, rôle, statut d'adhésion, fin de cotisation                   |
| `sessions`                 | sessions (empreinte SHA-256 du jeton, expiration glissante de 14 jours)                     |
| `user_tokens`              | liens de confirmation d'email et de réinitialisation (empreintes, usage unique)             |
| `rate_limits`              | compteurs de limitation de débit (partagés entre instances)                                 |
| `offers` / `offer_tariffs` | offres (billetterie ou sortie) et leurs tarifs, prix adhérent/public, stock                 |
| `offer_requests`           | demandes de commande (coordonnées) avant le paiement sur HelloAsso, paiement constaté       |
| `site_settings`            | réglages modifiables par le bureau (lien HelloAsso d'adhésion), une seule ligne             |
| `orders` / `order_lines`   | commandes, lignes avec libellé et prix **copiés** au moment de la commande                  |
| `media`                    | images téléversées (ré-encodées en WebP, métadonnées supprimées), servies par `/media/<id>` |
| `highlights`               | posts « À la une » du bandeau défilant                                                      |
| `partners`                 | avantages partenaires                                                                       |
| `news`                     | actualités (publiques ou réservées aux adhérents)                                           |
| `contact_messages`         | messages du formulaire de contact                                                           |
| `audit_logs`               | journal des actions du bureau                                                               |

Conventions : montants en centimes (entiers), horodatages `timestamptz`, dates calendaires `YYYY-MM-DD` interprétées à l'heure de Paris, contraintes `CHECK` sur prix, stocks et quantités, clés étrangères `restrict` sur l'historique des commandes.

### Cycle de vie

- **Adhésion** : `PENDING_VERIFICATION` → (email confirmé) `PENDING_APPROVAL` → (bureau) `ACTIVE` | `REJECTED` ; `ACTIVE` ↔ `SUSPENDED`. Une cotisation est valide si le compte est actif et que `membership_valid_until` n'est pas dépassée.
- **Commande** : `PENDING_PAYMENT` → `PAID` → `DELIVERED`, annulable tant qu'elle n'est pas remise (l'adhérent ne peut annuler qu'avant règlement). Les transitions sont définies dans `features/orders/rules.ts`.

### Intégrité des commandes

`features/orders/service.ts#createOrder`, en une transaction :

1. **Idempotence** : chaque formulaire porte une clé unique (`orders_user_idempotency_key`). Un double clic ou un rechargement renvoie la commande existante.
2. Verrouillage de l'adhérent (`SELECT … FOR UPDATE`) : deux commandes simultanées ne contournent pas la limite par adhérent.
3. Verrouillage des tarifs : le stock ne devient jamais négatif (également garanti par une contrainte `CHECK`).
4. Prix et total **recalculés depuis la base**, jamais pris dans le navigateur.

Ces garanties sont couvertes par des tests d'intégration concurrents (`tests/integration/orders.test.ts`).

## Sécurité

| Sujet                  | Mesure                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mots de passe          | Argon2id (paramètres OWASP), 12 caractères minimum, comparaison à temps constant y compris pour un compte inconnu                                                                                     |
| Sessions               | jeton aléatoire 256 bits, seule l'empreinte est stockée ; cookie `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax` ; révocation au changement de mot de passe, à la suspension et au changement de rôle |
| Énumération de comptes | réponses identiques à l'inscription et au « mot de passe oublié » ; le titulaire est prévenu par email                                                                                                |
| Force brute            | limitation par adresse (5 / 15 min) et par IP (30 / 15 min) à la connexion ; inscription, réinitialisation, contact et changement de mot de passe limités                                             |
| Autorisation           | matrice de droits `src/server/auth/permissions.ts`, vérifiée côté serveur ; pages bureau en 404 pour les non-habilités                                                                                |
| IDOR                   | toute lecture ou écriture d'une commande par un adhérent est filtrée sur son identifiant                                                                                                              |
| CSRF                   | Server Actions (vérification d'origine par Next.js) + cookies `SameSite=Lax`                                                                                                                          |
| XSS                    | contenus saisis stockés en texte brut et rendus par React ; CSP stricte à nonce (`strict-dynamic`)                                                                                                    |
| Redirections ouvertes  | paramètre `next` restreint aux chemins internes (`safeRedirectPath`)                                                                                                                                  |
| En-têtes               | HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`                                                                                           |
| Export CSV             | protection contre l'injection de formules                                                                                                                                                             |
| Données personnelles   | aucune liste d'adhérents publique, pas de traceur tiers, polices auto-hébergées, logs sans secret ni jeton (y compris dans les URL)                                                                   |
| Téléversement d'images | réservé au bureau, 8 Mo max, JPEG/PNG/WebP ; fichier décodé puis ré-encodé (un faux fichier image est rejeté, EXIF et GPS supprimés), 60 envois par heure au plus                                     |
| Anti-spam              | champ piège + limitation par IP sur le formulaire de contact                                                                                                                                          |

## Choix techniques

- **Next.js App Router + Server Actions** : rendu serveur (SEO, performance), pas d'API REST à maintenir ni à sécuriser séparément. JavaScript client limité aux formulaires interactifs et au menu mobile.
- **Rendu dynamique** de toutes les pages : exigé par la CSP à nonce, et sans coût notable à cette échelle.
- **PostgreSQL + Drizzle** : transactions et verrous nécessaires aux commandes, SQL explicite, migrations versionnées et reproductibles.
- **Sessions en base plutôt que JWT** : révocables immédiatement (suspension, changement de rôle).
- **Limitation de débit en base** : fonctionne avec plusieurs instances, sans Redis.
- **Aucune bibliothèque de composants** : le design system est spécifique à la marque (voir `DESIGN-SYSTEM.md`).
- **Environnement validé à l'exécution** (`src/server/env.ts`) : le build ne nécessite aucun secret.
