import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  elevated?: boolean
  glass?: boolean
}

/** Einheitliche Kartenfläche (Radius, Rand, Hintergrund). */
export function Card({
  children,
  elevated = false,
  glass = false,
  className = '',
  ...rest
}: CardProps) {
  const bg = glass ? 'glass' : elevated ? 'bg-elevated' : 'bg-surface'
  return (
    <div
      className={`rounded-card border border-separator ${bg} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
