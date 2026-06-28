import type { ReactNode } from 'react'

interface Props {
  /** Fortschritt 0..1 */
  progress: number
  size?: number
  stroke?: number
  children?: ReactNode
}

/** Kreisförmiger Fortschritt (SVG) mit Gold-Verlauf und sanfter Animation. */
export function ProgressRing({
  progress,
  size = 120,
  stroke = 12,
  children,
}: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - clamped)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2c868" />
            <stop offset="100%" stopColor="#c8a04a" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-elevated)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#goldRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
