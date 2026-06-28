interface Props {
  progress: number // 0..1
  className?: string
  /** Tailwind-Hintergrundklasse für die Füllung (Default Gold). */
  fillClass?: string
}

/** Schlanke horizontale Fortschrittsleiste (Sammelstatistik). */
export function ProgressBar({ progress, className = '', fillClass = 'bg-gold' }: Props) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-elevated ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${fillClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
