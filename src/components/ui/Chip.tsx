import type { ReactNode } from 'react'

interface Props {
  label: ReactNode
  active?: boolean
  onClick?: () => void
}

/** Umschaltbarer Filter-Chip. Aktiv = goldgefüllt. */
export function Chip({ label, active = false, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
        active
          ? 'bg-gold text-black'
          : 'border border-separator bg-elevated text-ink-2 active:bg-separator'
      }`}
    >
      {label}
    </button>
  )
}
