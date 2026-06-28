import type { ReactNode } from 'react'
import { Card } from './Card'

interface Props {
  value: ReactNode
  label: string
  icon: ReactNode
  tint?: string // Tailwind-Textfarbklasse
}

/** Kompakte Kennzahl-Kachel (Dashboard). */
export function StatTile({ value, label, icon, tint = 'text-gold' }: Props) {
  return (
    <Card className="flex-1 p-4">
      <div className={`mb-2 ${tint}`}>{icon}</div>
      <div className="text-xl font-bold text-ink">{value}</div>
      <div className="text-[13px] text-ink-2">{label}</div>
    </Card>
  )
}
