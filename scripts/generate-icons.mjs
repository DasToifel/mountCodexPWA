/**
 * Erzeugt die PWA-Icons (PNG) aus einem Inline-SVG via `sharp`.
 * Läuft einmalig über `npm run icons`. Ergebnisse landen in public/icons/.
 *
 * Warum ein Script: PWA/iOS brauchen echte PNGs (Manifest + apple-touch-icon).
 * So bleiben sie reproduzierbar im Repo, ohne Binär-Handarbeit.
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const logo = (size, padded) => {
  const inset = padded ? Math.round(size * 0.12) : 0
  const c = size / 2
  const r = (size / 2 - inset) * 0.62
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${padded ? size * 0.22 : 0}" fill="#0E1116"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#E6B450" stroke-width="${size * 0.05}"/>
    <circle cx="${c}" cy="${c}" r="${r * 0.5}" fill="#E6B450"/>
  </svg>`
}

const targets = [
  { name: 'pwa-192.png', size: 192, padded: false },
  { name: 'pwa-512.png', size: 512, padded: false },
  { name: 'pwa-maskable-512.png', size: 512, padded: true },
  { name: 'apple-touch-icon.png', size: 180, padded: true },
]

await mkdir(outDir, { recursive: true })
for (const t of targets) {
  await sharp(Buffer.from(logo(t.size, t.padded)))
    .png()
    .toFile(join(outDir, t.name))
  console.log('✓', t.name)
}
console.log('Icons erzeugt in public/icons/')
