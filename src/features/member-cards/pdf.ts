import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import fontkit from '@pdf-lib/fontkit'
import {
  clip,
  endPath,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  setCharacterSpacing,
} from 'pdf-lib'
import { site } from '@/config/site'
import { env } from '@/server/env'
import { type CardLayout, displayNames, formatMemberNumber, type MemberCardInput } from './schemas'

/*
 * Carte d'adhérent, modèle « Nuit » : fond bleu nuit, logo dans un cartouche blanc,
 * « 95 » en filigrane, nom en Archivo, filet tricolore, saison et adresse du site.
 * Format carte bancaire ISO 7810 ID-1 (85,6 × 54 mm).
 */

const MM = 72 / 25.4
const CARD_W = 85.6 * MM
const CARD_H = 54 * MM
const RADIUS = 3.2 * MM

const hex = (value: string) =>
  rgb(
    Number.parseInt(value.slice(1, 3), 16) / 255,
    Number.parseInt(value.slice(3, 5), 16) / 255,
    Number.parseInt(value.slice(5, 7), 16) / 255,
  )

const COLORS = {
  night: hex('#012551'),
  white: hex('#ffffff'),
  amber: hex('#fdc291'),
  pale: hex('#bfdeee'),
  flagBlue: hex('#002395'),
  flagRed: hex('#ed2939'),
  cut: hex('#7a8794'),
}

/** Polices et logo, lus une fois sur le disque (inclus dans le build autonome). */
const ASSETS_DIR = path.join(process.cwd(), 'src/features/member-cards/assets')
let assets: Promise<Record<'black' | 'semibold' | 'text' | 'logo', Uint8Array>> | null = null
function loadAssets() {
  assets ??= Promise.all([
    readFile(path.join(ASSETS_DIR, 'archivo-latin-900-normal.woff')),
    readFile(path.join(ASSETS_DIR, 'archivo-latin-600-normal.woff')),
    readFile(path.join(ASSETS_DIR, 'source-sans-3-latin-600-normal.woff')),
    readFile(path.join(ASSETS_DIR, 'logo.png')),
  ]).then(([black, semibold, text, logo]) => ({ black, semibold, text, logo }))
  return assets
}

/** Rectangle aux coins arrondis, en coordonnées SVG (origine en haut à gauche). */
function roundedRect(width: number, height: number, radius: number) {
  const r = radius
  return [
    `M ${r} 0 H ${width - r} A ${r} ${r} 0 0 1 ${width} ${r}`,
    `V ${height - r} A ${r} ${r} 0 0 1 ${width - r} ${height}`,
    `H ${r} A ${r} ${r} 0 0 1 0 ${height - r}`,
    `V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`,
  ].join(' ')
}

/** Texte espacé (lettrage), éventuellement aligné à droite sur `x`. */
function spacedText(
  page: PDFPage,
  text: string,
  options: {
    x: number
    y: number
    size: number
    font: PDFFont
    color: ReturnType<typeof rgb>
    spacing: number
    alignRight?: boolean
  },
) {
  const width = options.font.widthOfTextAtSize(text, options.size) + options.spacing * (text.length - 1)
  page.pushOperators(pushGraphicsState(), setCharacterSpacing(options.spacing))
  page.drawText(text, {
    x: options.alignRight ? options.x - width : options.x,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color,
  })
  page.pushOperators(setCharacterSpacing(0), popGraphicsState())
}

/** Plus grande taille (≤ `max`) pour que le texte tienne dans `width`. */
function fitSize(font: PDFFont, text: string, max: number, width: number) {
  const natural = font.widthOfTextAtSize(text, max)
  return natural <= width ? max : Math.max(7, (max * width) / natural)
}

function drawCard(
  page: PDFPage,
  fonts: { black: PDFFont; semibold: PDFFont; text: PDFFont },
  logo: Awaited<ReturnType<PDFDocument['embedPng']>>,
  origin: { x: number; y: number },
  person: { lastName: string; firstName: string; number: number },
  season: string,
  rounded: boolean,
) {
  const { x, y } = origin
  const top = y + CARD_H

  // Fond, limité au contour de la carte.
  if (rounded) page.drawSvgPath(roundedRect(CARD_W, CARD_H, RADIUS), { x, y: top, color: COLORS.night })
  else page.drawRectangle({ x, y, width: CARD_W, height: CARD_H, color: COLORS.night })

  page.pushOperators(pushGraphicsState(), rectangle(x, y, CARD_W, CARD_H), clip(), endPath())
  // « 95 » en filigrane, débordant en bas à droite.
  const watermarkSize = 42 * MM
  const watermarkWidth = fonts.black.widthOfTextAtSize('95', watermarkSize)
  page.drawText('95', {
    x: x + CARD_W - watermarkWidth + 3 * MM,
    y: y - 2 * MM,
    size: watermarkSize,
    font: fonts.black,
    color: COLORS.white,
    opacity: 0.06,
  })
  page.pushOperators(popGraphicsState())

  // Logo dans un cartouche blanc.
  const logoWidth = 21 * MM
  const logoHeight = (logoWidth * logo.height) / logo.width
  const padX = 2 * MM
  const padY = 1.4 * MM
  const boxW = logoWidth + padX * 2
  const boxH = logoHeight + padY * 2
  page.drawSvgPath(roundedRect(boxW, boxH, 1.6 * MM), { x: x + 5 * MM, y: top - 5 * MM, color: COLORS.white })
  page.drawImage(logo, {
    x: x + 5 * MM + padX,
    y: top - 5 * MM - padY - logoHeight,
    width: logoWidth,
    height: logoHeight,
  })

  // « Carte d'adhérent », en haut à droite.
  const labelSize = 7.4
  const spacing = labelSize * 0.14
  spacedText(page, 'CARTE', {
    x: x + CARD_W - 5 * MM,
    y: top - 6 * MM - labelSize,
    size: labelSize,
    font: fonts.text,
    color: COLORS.amber,
    spacing,
    alignRight: true,
  })
  spacedText(page, 'D’ADHÉRENT', {
    x: x + CARD_W - 5 * MM,
    y: top - 6 * MM - labelSize * 2.4,
    size: labelSize,
    font: fonts.text,
    color: COLORS.amber,
    spacing,
    alignRight: true,
  })

  // Numéro d'adhérent.
  const numberText = `N° ${formatMemberNumber(person.number)}`
  const numberSize = 8.5
  page.drawText(numberText, {
    x: x + CARD_W - 5 * MM - fonts.semibold.widthOfTextAtSize(numberText, numberSize),
    y: top - 6 * MM - labelSize * 2.4 - numberSize * 1.9,
    size: numberSize,
    font: fonts.semibold,
    color: COLORS.white,
  })

  // Identité.
  const maxWidth = CARD_W - 10 * MM
  const nameSize = fitSize(fonts.black, person.lastName, 15, maxWidth)
  const firstSize = fitSize(fonts.semibold, person.firstName, 10.5, maxWidth)
  const firstY = y + 9 * MM + 1.4 * MM
  page.drawText(person.firstName, {
    x: x + 5 * MM,
    y: firstY,
    size: firstSize,
    font: fonts.semibold,
    color: COLORS.pale,
  })
  page.drawText(person.lastName, {
    x: x + 5 * MM,
    y: firstY + firstSize * 1.05,
    size: nameSize,
    font: fonts.black,
    color: COLORS.white,
  })

  // Filet tricolore (dégradé bleu → blanc → rouge).
  const ruleX = x + 5 * MM
  const ruleY = y + 7.2 * MM
  const ruleW = 18 * MM
  const steps = 48
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const [from, to, local] =
      t < 0.5 ? [COLORS.flagBlue, COLORS.white, t * 2] : [COLORS.white, COLORS.flagRed, (t - 0.5) * 2]
    const mix = (a: number, b: number) => a + (b - a) * local
    page.drawRectangle({
      x: ruleX + (ruleW * i) / steps,
      y: ruleY,
      width: ruleW / steps + 0.2,
      height: 0.8 * MM,
      color: rgb(mix(from.red, to.red), mix(from.green, to.green), mix(from.blue, to.blue)),
    })
  }

  // Saison et adresse du site.
  const metaSize = 6.4
  const siteHost = new URL(env.APP_URL).host
  page.drawText(`Saison ${season}`, {
    x: x + 5 * MM,
    y: y + 3.5 * MM,
    size: metaSize,
    font: fonts.text,
    color: COLORS.pale,
  })
  page.drawText(siteHost, {
    x: x + CARD_W - 5 * MM - fonts.text.widthOfTextAtSize(siteHost, metaSize),
    y: y + 3.5 * MM,
    size: metaSize,
    font: fonts.text,
    color: COLORS.pale,
  })
}

/** Repères de coupe aux quatre coins de la carte. */
function drawCropMarks(page: PDFPage, x: number, y: number) {
  const gap = 2 * MM
  const length = 6 * MM
  const line = { thickness: 0.4, color: COLORS.cut }
  for (const [cx, cy, dx, dy] of [
    [x, y, -1, -1],
    [x + CARD_W, y, 1, -1],
    [x, y + CARD_H, -1, 1],
    [x + CARD_W, y + CARD_H, 1, 1],
  ] as const) {
    page.drawLine({
      start: { x: cx + dx * gap, y: cy },
      end: { x: cx + dx * (gap + length), y: cy },
      ...line,
    })
    page.drawLine({
      start: { x: cx, y: cy + dy * gap },
      end: { x: cx, y: cy + dy * (gap + length) },
      ...line,
    })
  }
}

/**
 * PDF d'une carte d'adhérent.
 * - `carte` : une page au format exact de la carte, fond à bord perdu (imprimeur, imprimante à cartes) ;
 * - `a4` : la carte au centre d'une page A4, avec repères de coupe (impression au bureau).
 */
export async function buildMemberCardPdf(
  input: MemberCardInput & { number: number },
  season: string,
  layout: CardLayout,
) {
  const files = await loadAssets()
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const person = { ...displayNames(input), number: input.number }
  doc.setTitle(`Carte d’adhérent ${site.shortName} — ${person.firstName} ${person.lastName}`)
  doc.setAuthor(site.legalName)
  doc.setCreator(site.legalName)
  doc.setProducer(site.shortName)
  doc.setLanguage('fr-FR')

  const fonts = {
    black: await doc.embedFont(files.black, { subset: true }),
    semibold: await doc.embedFont(files.semibold, { subset: true }),
    text: await doc.embedFont(files.text, { subset: true }),
  }
  const logo = await doc.embedPng(files.logo)

  if (layout === 'carte') {
    const page = doc.addPage([CARD_W, CARD_H])
    drawCard(page, fonts, logo, { x: 0, y: 0 }, person, season, false)
  } else {
    const page = doc.addPage([210 * MM, 297 * MM])
    const x = (page.getWidth() - CARD_W) / 2
    const y = page.getHeight() - 40 * MM - CARD_H
    drawCropMarks(page, x, y)
    drawCard(page, fonts, logo, { x, y }, person, season, true)
    page.drawText('Carte d’adhérent — à découper en suivant les repères (format 85,6 × 54 mm).', {
      x: x - 20 * MM,
      y: y - 14 * MM,
      size: 8,
      font: fonts.text,
      color: COLORS.cut,
    })
  }
  return doc.save()
}
