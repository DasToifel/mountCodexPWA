interface Props {
  progress: number // 0..1
  className?: string
}

/** Schlanke horizontale Fortschrittsleiste (Sammelstatistik). */
export function ProgressBar({ progress, className = '' }: Props) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-elevated ${className}`}>
      <div
        className="h-full rounded-full bg-gold transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
