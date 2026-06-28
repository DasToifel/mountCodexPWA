interface Props {
  title: string
  actionLabel?: string
  onAction?: () => void
}

/** Sektions-Überschrift mit optionaler „Mehr“-Aktion. */
export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-medium text-gold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
