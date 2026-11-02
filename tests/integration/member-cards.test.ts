import { execFileSync } from 'node:child_process'
import { generateKeyPairSync, verify } from 'node:crypto'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { unzipSync } from 'fflate'
import forge from 'node-forge'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildApplePass } from '@/features/member-cards/apple-wallet'
import { googleWalletSaveUrl } from '@/features/member-cards/google-wallet'
import { createMemberToken, readMemberToken } from '@/features/member-cards/member-link'
import { formatMemberNumber, memberCardSchema } from '@/features/member-cards/schemas'
import { deleteMember, issueMemberCard, listMembers } from '@/features/member-cards/service'
import { db } from '@/server/db/client'
import { auditLogs } from '@/server/db/schema'
import { createBureauUser, resetDatabase } from '../support/db'

const card = (lastName: string, firstName: string) => memberCardSchema.parse({ lastName, firstName })

describe('listing des adhérents', () => {
  beforeEach(resetDatabase)

  it('numérote les nouveaux adhérents et garde le numéro au renouvellement', async () => {
    const admin = await createBureauUser({ role: 'BUREAU' })
    const first = await issueMemberCard(admin.id, card('Martin', 'Camille'), '2027')
    const second = await issueMemberCard(admin.id, card('Durand', 'Léa'), '2027')
    expect(first.created).toBe(true)
    expect(second.member.number).toBe(first.member.number + 1)

    // Même personne, saisie un peu différente (casse, accents) : même numéro, nouvelle saison.
    const renewed = await issueMemberCard(admin.id, card('MARTIN', 'camille'), '2028')
    expect(renewed.created).toBe(false)
    expect(renewed.member.number).toBe(first.member.number)
    expect(renewed.member.season).toBe('2028')
    expect(renewed.member.lastName).toBe('Martin')
    expect(await listMembers()).toHaveLength(2)

    expect(await deleteMember(admin.id, second.member.id)).toBe(true)
    expect(await listMembers()).toHaveLength(1)
    const actions = (await db.select().from(auditLogs)).map((entry) => entry.action)
    expect(actions).toEqual(expect.arrayContaining(['member.created', 'member.renewed', 'member.deleted']))
    expect(formatMemberNumber(7)).toBe('0007')
  })
})

describe('lien personnel', () => {
  const secret = 'x'.repeat(40)
  const id = '3f2b8c1e-9d4a-4b6f-8a2e-1c5d7e9f0a12'

  it('accepte un jeton authentique et refuse les jetons modifiés ou expirés', () => {
    const token = createMemberToken(id, secret, 1_000)
    expect(readMemberToken(token, secret, 2_000)).toBe(id)
    expect(readMemberToken(token, 'y'.repeat(40), 2_000)).toBeNull()
    expect(readMemberToken(`${token}x`, secret, 2_000)).toBeNull()
    expect(readMemberToken(token, secret, 1_000 + 401 * 24 * 3600 * 1000)).toBeNull()
    const [data, signature] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ m: id, e: 9e15 })).toString('base64url')
    expect(readMemberToken(`${forged}.${signature}`, secret, 2_000)).toBeNull()
    expect(data).not.toContain('Martin')
  })
})

/** Certificat auto-signé, pour tester la signature sans les vrais certificats Apple. */
function testCertificate(commonName: string) {
  const keys = forge.pki.rsa.generateKeyPair(2048)
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date(Date.now() - 86_400_000)
  cert.validity.notAfter = new Date(Date.now() + 86_400_000)
  cert.setSubject([{ name: 'commonName', value: commonName }])
  cert.setIssuer([{ name: 'commonName', value: commonName }])
  cert.sign(keys.privateKey, forge.md.sha256.create())
  return { cert: forge.pki.certificateToPem(cert), key: forge.pki.privateKeyToPem(keys.privateKey) }
}

const member = {
  id: '3f2b8c1e-9d4a-4b6f-8a2e-1c5d7e9f0a12',
  number: 42,
  lastName: 'Martin',
  firstName: 'Camille',
  nameKey: 'martin|camille',
  season: '2027',
  createdById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Apple Wallet', () => {
  it('produit un .pkpass dont le manifeste et la signature sont valides', async () => {
    const pass = testCertificate('Pass Type ID: pass.fr.adpvo.test')
    const wwdr = testCertificate('Apple WWDR (test)')
    const file = await buildApplePass(member, {
      passTypeId: 'pass.fr.adpvo.test',
      teamId: 'ABCDE12345',
      certificate: pass.cert,
      privateKey: pass.key,
      passphrase: undefined,
      wwdr: wwdr.cert,
    })
    const entries = unzipSync(file)
    expect(Object.keys(entries).sort()).toEqual(
      [
        'icon.png',
        'icon@2x.png',
        'icon@3x.png',
        'logo.png',
        'logo@2x.png',
        'logo@3x.png',
        'manifest.json',
        'pass.json',
        'signature',
      ].sort(),
    )
    const json = JSON.parse(Buffer.from(entries['pass.json']!).toString())
    expect(json.generic.primaryFields[0].value).toBe('Camille MARTIN')
    expect(json.generic.secondaryFields[0].value).toBe('0042')

    // Vérification de la signature PKCS#7 détachée avec OpenSSL.
    const dir = mkdtempSync(path.join(tmpdir(), 'pkpass-'))
    writeFileSync(path.join(dir, 'manifest.json'), entries['manifest.json']!)
    writeFileSync(path.join(dir, 'signature'), entries.signature!)
    writeFileSync(path.join(dir, 'ca.pem'), pass.cert)
    const output = execFileSync(
      'openssl',
      [
        'smime',
        '-verify',
        '-binary',
        '-inform',
        'DER',
        '-in',
        'signature',
        '-content',
        'manifest.json',
        '-noverify',
        '-out',
        '/dev/null',
      ],
      { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] },
    )
    expect(output).toBeDefined()
  })
})

describe('Google Wallet', () => {
  it('produit un lien dont le jeton JWT est signé par le compte de service', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const url = googleWalletSaveUrl(member, {
      issuerId: '3388000000000000000',
      clientEmail: 'wallet@adpvo.iam.gserviceaccount.com',
      privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    })
    expect(url.startsWith('https://pay.google.com/gp/v/save/')).toBe(true)
    const [header, payload, signature] = url.split('/').pop()!.split('.')
    expect(
      verify(
        'RSA-SHA256',
        Buffer.from(`${header}.${payload}`),
        publicKey,
        Buffer.from(signature!, 'base64url'),
      ),
    ).toBe(true)
    const body = JSON.parse(Buffer.from(payload!, 'base64url').toString())
    expect(body.typ).toBe('savetowallet')
    expect(body.payload.genericObjects[0].header.defaultValue.value).toBe('Camille MARTIN')
  })
})
