import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

/** Einheitlicher Leerzustand (keine Treffer, leere Listen). */
export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="text-ink-3">
        {icon ?? (
          <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none">
            <path
              d="m21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>
      <h3 className="font-semibold text-ink">{title}</h3>
      {message && <p className="text-sm text-ink-2">{message}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 font-semibold text-gold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
