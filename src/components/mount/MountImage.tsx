import { useState } from 'react'
import { RARITY_BORDER, RARITY_TEXT } from './RarityBadge'
import type { Rarity } from '@/types/mount'

interface Props {
  src?: string
  alt: string
  rarity: Rarity
  className?: string
  rounded?: string
  /** Stabiler Seed (z. B. Mount-ID) für den prozeduralen Platzhalter. */
  seed?: number
}

/** Deterministischer Farbton aus einem String/Seed (0..360). */
function hue(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

/**
 * Einheitliche Mount-Bilddarstellung mit seltenheits-gefärbtem Rand.
 *
 * Bilder sind noch nicht vorhanden → hochwertiger PROZEDURALER Platzhalter:
 * ein deterministischer Farbverlauf (stabil pro Mount) mit Initiale. Sobald
 * echte Bildpfade in den Daten stehen, werden sie automatisch geladen
 * (lazy + async); fällt das Laden fehl, greift wieder der Platzhalter.
 */
export function MountImage({
  src,
  alt,
  rarity,
  className = '',
  rounded = 'rounded-card',
  seed,
}: Props) {
  const [failed, setFailed] = useState(false)
  const showImg = src && !failed

  const h = hue(seed != null ? String(seed) : alt)
  const initial = alt.trim().charAt(0).toUpperCase() || '?'
  const gradient = `linear-gradient(135deg, hsl(${h} 45% 22%), hsl(${(h + 40) % 360} 55% 12%))`

  return (
    <div
      className={`relative overflow-hidden border-2 ${RARITY_BORDER[rarity]} ${rounded} ${className}`}
    >
      {showImg ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: gradient }}
          aria-label={alt}
        >
          <span
            className={`select-none text-[2.5em] font-black opacity-25 ${RARITY_TEXT[rarity]}`}
          >
            {initial}
          </span>
        </div>
      )}
      {/* dezenter Glanz oben für „Premium“-Look */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  )
}
