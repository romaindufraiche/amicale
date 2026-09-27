# Mettre le site en ligne pour le faire tester

Objectif : obtenir une adresse du type `https://adpvo.vercel.app` à envoyer aux testeurs, qui n'ont
rien à installer. Deux services gratuits suffisent :

- **Vercel** héberge le site (il se met à jour automatiquement à chaque modification poussée sur GitHub) ;
- **Neon** fournit la base PostgreSQL (ajoutée en un clic depuis Vercel).

Durée : environ 15 minutes, sans ligne de commande sauf l'étape 4.

## 1. Créer le projet sur Vercel

1. Aller sur <https://vercel.com> et choisir **Continue with GitHub**.
2. **Add New… → Project**, puis importer le dépôt `romaindufraiche/amicale`.
3. Dans **Configure Project** :
   - _Framework Preset_ : Next.js (détecté automatiquement) ;
   - _Root Directory_ : laisser tel quel ;
   - ouvrir **Environment Variables** et ajouter les variables de l'étape 3 (on peut aussi le faire après).
4. Si la branche n'est pas encore fusionnée dans `main`, aller ensuite dans
   **Settings → Git → Production Branch** et indiquer `claude/vigilant-shannon-r078sb`.

## 2. Ajouter la base de données

Dans le projet Vercel : **Storage → Create Database → Neon (Serverless Postgres)** → région
**Europe (Frankfurt)** → **Create** → **Connect** au projet.
Vercel ajoute alors automatiquement la variable `DATABASE_URL`.

## 3. Variables d'environnement

**Settings → Environment Variables**, pour l'environnement _Production_ :

| Variable                    | Valeur                                                             |
| --------------------------- | ------------------------------------------------------------------ |
| `APP_URL`                   | l'adresse du site, ex. `https://adpvo.vercel.app` (sans `/` final) |
| `MAIL_FROM`                 | `ADPVO <no-reply@example.org>`                                     |
| `BUREAU_EMAIL`              | votre adresse email                                                |
| `TRUST_PROXY`               | `true`                                                             |
| `DB_POOL_MAX`               | `3`                                                                |
| `DEMO_MODE`                 | `true` (bandeau « Version de démonstration »)                      |
| `MAIL_TRANSPORT`            | `outbox`                                                           |
| `MAIL_OUTBOX_IN_PRODUCTION` | `true`                                                             |
| `MAIL_OUTBOX_DIR`           | `/tmp/outbox`                                                      |

Avec ces trois dernières lignes, **aucun email n'est envoyé** : c'est suffisant pour une démonstration
avec les comptes de test. Pour que l'inscription d'un vrai testeur fonctionne (lien de confirmation
par email), utiliser plutôt un service SMTP, par exemple Brevo (gratuit jusqu'à 300 emails par jour) :
`MAIL_TRANSPORT=smtp`, `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER` et
`SMTP_PASSWORD` fournis par Brevo, et supprimer `MAIL_OUTBOX_IN_PRODUCTION` et `MAIL_OUTBOX_DIR`.

Puis **Deployments → … → Redeploy**. À chaque déploiement, les migrations de la base sont appliquées
automatiquement (script `vercel-build`).

## 4. Charger les données de démonstration (une seule fois)

Dans Vercel : **Storage → la base Neon → .env.local → Show secret**, copier la valeur de
`DATABASE_URL`. Puis, sur votre Mac, dans le dossier du projet :

```bash
DATABASE_URL="collez-ici-l-adresse-neon" pnpm db:seed:demo
```

La commande refuse de s'exécuter si la base contient déjà de vrais comptes.

## 5. Envoyer le lien aux testeurs

Adresse : celle affichée par Vercel (**Domains**). Comptes de test (mot de passe `demo-mot-de-passe`) :

| Compte                | Pour tester                                |
| --------------------- | ------------------------------------------ |
| `adherent@demo.local` | l'espace adhérent : billetterie, commandes |
| `bureau@demo.local`   | l'espace bureau (administration)           |

⚠️ Ces identifiants sont publics dans ce dépôt : le site de démonstration ne doit contenir **aucune
donnée réelle**. Pour la mise en production, créer une base neuve, retirer `DEMO_MODE`, configurer
un vrai SMTP et créer l'administrateur avec `pnpm admin:create` (voir `EXPLOITATION.md`).
