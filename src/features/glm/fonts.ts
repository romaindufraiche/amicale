import localFont from 'next/font/local'

/*
 * Polices de la charte GLM (licence SIL OFL), auto-hébergées comme celles du site.
 * Chargées uniquement sur les pages qui affichent l'annonce GLM.
 */
export const glmTitleFont = localFont({
  src: '../../app/fonts/glm/libre-caslon-display-latin-400-normal.woff2',
  weight: '400',
  display: 'swap',
  preload: false,
})

export const glmTextFont = localFont({
  src: [
    { path: '../../app/fonts/glm/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../app/fonts/glm/ibm-plex-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
})
