/**
 * Le serveur autonome (`output: 'standalone'`) ne contient ni les fichiers statiques
 * ni le dossier public : on les copie à côté de `server.js` après le build.
 */
import { cpSync, existsSync } from 'node:fs'

if (!existsSync('.next/standalone')) {
  throw new Error('Build autonome introuvable : lancez `pnpm build`.')
}
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true })
if (existsSync('public')) cpSync('public', '.next/standalone/public', { recursive: true })
