import 'server-only'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { zipSync } from 'fflate'
import forge from 'node-forge'
import sharp from 'sharp'
import { site } from '@/config/site'
import type { Member } from '@/server/db/schema'
import { env } from '@/server/env'
import { displayNames, formatMemberNumber } from './schemas'

/*
 * Apple Wallet : carte d'adhérent au format .pkpass (pass « generic »), signée avec le
 * certificat « Pass Type ID » de l'Amicale. Désactivé tant que les certificats ne sont
 * pas configurés (voir .env.example et docs/EXPLOITATION.md).
 */

type AppleWalletConfig = {
  passTypeId: string
  teamId: string
  certificate: string
  privateKey: string
  passphrase: string | undefined
  wwdr: string
}

const decode = (base64: string) => Buffer.from(base64, 'base64').toString('utf8')

export function appleWalletConfig(): AppleWalletConfig | null {
  const {
    APPLE_WALLET_PASS_TYPE_ID: passTypeId,
    APPLE_WALLET_TEAM_ID: teamId,
    APPLE_WALLET_CERTIFICATE: certificate,
    APPLE_WALLET_PRIVATE_KEY: privateKey,
    APPLE_WALLET_WWDR_CERTIFICATE: wwdr,
  } = env
  if (!passTypeId || !teamId || !certificate || !privateKey || !wwdr) return null
  return {
    passTypeId,
    teamId,
    certificate: decode(certificate),
    privateKey: decode(privateKey),
    passphrase: env.APPLE_WALLET_PRIVATE_KEY_PASSPHRASE,
    wwdr: decode(wwdr),
  }
}

const LOGO_FILE = path.join(process.cwd(), 'src/features/member-cards/assets/logo.png')

/** Images du pass : logo dans un cartouche blanc, icône carrée. */
async function passImages() {
  const logo = await readFile(LOGO_FILE)
  const pill = async (scale: number) => {
    const width = 150 * scale
    const height = 50 * scale
    const inner = await sharp(logo)
      .resize({
        width: width - 12 * scale,
        height: height - 8 * scale,
        fit: 'contain',
        background: '#ffffff',
      })
      .png()
      .toBuffer()
    const shape = Buffer.from(
      `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${8 * scale}" fill="#fff"/></svg>`,
    )
    return sharp(shape)
      .composite([{ input: inner, gravity: 'center' }])
      .png()
      .toBuffer()
  }
  const icon = (size: number) =>
    sharp(logo)
      .resize({ width: size, height: size, fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer()
  const [logo1, logo2, logo3, icon1, icon2, icon3] = await Promise.all([
    pill(1),
    pill(2),
    pill(3),
    icon(29),
    icon(58),
    icon(87),
  ])
  return {
    'logo.png': logo1,
    'logo@2x.png': logo2,
    'logo@3x.png': logo3,
    'icon.png': icon1,
    'icon@2x.png': icon2,
    'icon@3x.png': icon3,
  }
}

/** Identifiants ASN.1 utilisés par la signature. */
const OID = {
  sha256: '2.16.840.1.101.3.4.2.1',
  data: '1.2.840.113549.1.7.1',
  contentType: '1.2.840.113549.1.9.3',
  messageDigest: '1.2.840.113549.1.9.4',
  signingTime: '1.2.840.113549.1.9.5',
}

/** Signature PKCS#7 détachée du manifeste, exigée par Apple. */
function signManifest(manifest: Buffer, config: AppleWalletConfig): Buffer {
  const certificate = forge.pki.certificateFromPem(config.certificate)
  const wwdr = forge.pki.certificateFromPem(config.wwdr)
  const key = config.passphrase
    ? forge.pki.decryptRsaPrivateKey(config.privateKey, config.passphrase)
    : forge.pki.privateKeyFromPem(config.privateKey)
  if (!key) throw new Error('Clé privée Apple Wallet illisible (mot de passe ?)')
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(manifest.toString('binary'))
  p7.addCertificate(certificate)
  p7.addCertificate(wwdr)
  p7.addSigner({
    key,
    certificate,
    digestAlgorithm: OID.sha256,
    authenticatedAttributes: [
      { type: OID.contentType, value: OID.data },
      { type: OID.messageDigest },
      { type: OID.signingTime, value: new Date() as unknown as string },
    ],
  })
  p7.sign({ detached: true })
  return Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary')
}

/** Fichier .pkpass de la carte d'un adhérent. */
export async function buildApplePass(member: Member, config: AppleWalletConfig): Promise<Uint8Array> {
  const person = displayNames(member)
  const pass = {
    formatVersion: 1,
    passTypeIdentifier: config.passTypeId,
    teamIdentifier: config.teamId,
    serialNumber: member.id,
    organizationName: site.legalName,
    description: `Carte d’adhérent ${site.shortName}`,
    backgroundColor: 'rgb(1, 37, 81)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(253, 194, 145)',
    sharingProhibited: true,
    generic: {
      primaryFields: [
        { key: 'member', label: 'CARTE D’ADHÉRENT', value: `${person.firstName} ${person.lastName}` },
      ],
      secondaryFields: [
        { key: 'number', label: 'N° D’ADHÉRENT', value: formatMemberNumber(member.number) },
        { key: 'season', label: 'SAISON', value: member.season },
      ],
      backFields: [
        { key: 'name', label: 'Association', value: site.legalName },
        { key: 'site', label: 'Site', value: env.APP_URL },
        {
          key: 'note',
          label: 'À savoir',
          value:
            'Carte d’adhérent de l’Amicale. Elle ne constitue ni une pièce d’identité ni une carte professionnelle.',
        },
      ],
    },
  }
  const files: Record<string, Buffer> = {
    'pass.json': Buffer.from(JSON.stringify(pass)),
    ...(await passImages()),
  }
  const manifest = Buffer.from(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(files).map(([name, content]) => [
          name,
          createHash('sha1').update(content).digest('hex'),
        ]),
      ),
    ),
  )
  const signature = signManifest(manifest, config)
  return zipSync({
    ...Object.fromEntries(Object.entries(files).map(([name, content]) => [name, new Uint8Array(content)])),
    'manifest.json': new Uint8Array(manifest),
    signature: new Uint8Array(signature),
  })
}
