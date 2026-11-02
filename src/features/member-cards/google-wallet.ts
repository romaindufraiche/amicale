import 'server-only'
import { createSign } from 'node:crypto'
import { site } from '@/config/site'
import type { Member } from '@/server/db/schema'
import { env } from '@/server/env'
import { displayNames, formatMemberNumber } from './schemas'

/*
 * Google Wallet (Android) : lien « Enregistrer dans Google Wallet ». La carte (classe et
 * objet « generic ») est décrite dans un jeton JWT signé avec la clé du compte de service
 * Google Cloud de l'Amicale. Désactivé tant que l'émetteur n'est pas configuré.
 */

type GoogleWalletConfig = { issuerId: string; clientEmail: string; privateKey: string }

export function googleWalletConfig(): GoogleWalletConfig | null {
  const { GOOGLE_WALLET_ISSUER_ID: issuerId, GOOGLE_WALLET_SERVICE_ACCOUNT: account } = env
  if (!issuerId || !account) return null
  const parsed: unknown = JSON.parse(Buffer.from(account, 'base64').toString('utf8'))
  const { client_email: clientEmail, private_key: privateKey } = (parsed ?? {}) as Record<string, unknown>
  if (typeof clientEmail !== 'string' || typeof privateKey !== 'string') {
    throw new Error('GOOGLE_WALLET_SERVICE_ACCOUNT : clé JSON de compte de service invalide')
  }
  return { issuerId, clientEmail, privateKey }
}

const text = (value: string) => ({ defaultValue: { language: 'fr', value } })

/** Adresse « Enregistrer dans Google Wallet » de la carte d'un adhérent. */
export function googleWalletSaveUrl(member: Member, config: GoogleWalletConfig): string {
  const person = displayNames(member)
  const classId = `${config.issuerId}.adpvo_carte_adherent`
  const payload = {
    iss: config.clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [env.APP_URL],
    payload: {
      genericClasses: [{ id: classId }],
      genericObjects: [
        {
          id: `${config.issuerId}.adherent_${member.id.replace(/-/g, '')}`,
          classId,
          state: 'ACTIVE',
          cardTitle: text(`${site.shortName} — Carte d’adhérent`),
          subheader: text('Adhérent'),
          header: text(`${person.firstName} ${person.lastName}`),
          hexBackgroundColor: '#012551',
          logo: {
            sourceUri: { uri: `${env.APP_URL}/brand/wallet-logo.png` },
            contentDescription: text(`Logo ${site.shortName}`),
          },
          textModulesData: [
            { id: 'numero', header: 'N° d’adhérent', body: formatMemberNumber(member.number) },
            { id: 'saison', header: 'Saison', body: member.season },
            { id: 'association', header: 'Association', body: site.legalName },
          ],
        },
      ],
    },
  }
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(payload)}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(config.privateKey, 'base64url')
  return `https://pay.google.com/gp/v/save/${unsigned}.${signature}`
}
