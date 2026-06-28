import { useState } from 'react'
import { RARITY_BORDER, RARITY_TEXT } from './RarityBadge'
import type { Rarity } from '@/types/mount'

interface Props {
  src?: string
  alt: string
  rarity: Rarity
  className?: string
  rounded?: string
}

/**
 * Einheitliche Mount-Bilddarstellung mit seltenheits-gefärbtem Rand.
 * Lazy-Loading + sauberer Platzhalter bei fehlendem/fehlerhaftem Bild.
 */
export function MountImage({
  src,
  alt,
  rarity,
  className = '',
  rounded = 'rounded-card',
}: Props) {
  const [failed, setFailed] = useState(false)
  const showImg = src && !failed

  return (
    <div
      className={`relative overflow-hidden border-2 ${RARITY_BORDER[rarity]} ${rounded} bg-elevated ${className}`}
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
          className={`flex h-full w-full items-center justify-center ${RARITY_TEXT[rarity]} opacity-60`}
        >
          {/* Schlichtes Reittier-Icon als Platzhalter */}
          <svg viewBox="0 0 24 24" className="h-1/3 w-1/3" fill="currentColor">
            <path d="M3 13c0-1.1.9-2 2-2h2l1.5-3A2 2 0 0 1 11.3 7H14l3 4h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0v-4Zm3 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
          </svg>
        </div>
      )}
    </div>
  )
}
