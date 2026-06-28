import { RARITY_LABEL, type Rarity } from '@/types/mount'

/** Tailwind-Klassen je Seltenheit (nutzt die Theme-Farben aus index.css). */
export const RARITY_TEXT: Record<Rarity, string> = {
  common: 'text-common',
  uncommon: 'text-uncommon',
  rare: 'text-rare',
  epic: 'text-epic',
  legendary: 'text-legendary',
}

export const RARITY_BORDER: Record<Rarity, string> = {
  common: 'border-common',
  uncommon: 'border-uncommon',
  rare: 'border-rare',
  epic: 'border-epic',
  legendary: 'border-legendary',
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${RARITY_TEXT[rarity]} bg-white/5`}
    >
      {RARITY_LABEL[rarity]}
    </span>
  )
}
