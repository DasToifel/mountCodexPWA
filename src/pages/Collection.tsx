import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { computeStats } from '@/lib/stats'
import { toPercent } from '@/lib/format'
import {
  EXPANSIONS,
  EXPANSION_SHORT,
  SOURCE_LABEL,
  type Expansion,
  type SourceType,
} from '@/types/mount'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SectionHeader } from '@/components/ui/SectionHeader'

export function Collection() {
  const { mounts, collectedSet } = useApp()
  const navigate = useNavigate()
  const stats = useMemo(() => computeStats(mounts, collectedSet), [mounts, collectedSet])

  const sources = Object.keys(SOURCE_LABEL) as SourceType[]

  return (
    <div className="space-y-6">
      <h1 className="pt-2 text-2xl font-bold text-ink">Sammlung</h1>

      {/* Gesamt */}
      <Card className="flex items-center gap-5 p-4">
        <ProgressRing progress={stats.progress} size={104}>
          <span className="text-xl font-bold text-ink">{toPercent(stats.progress)}%</span>
        </ProgressRing>
        <div>
          <div className="font-semibold text-ink">Gesamt</div>
          <div className="font-mono text-ink-2">
            {stats.collected} / {stats.total}
          </div>
          <div className="text-[13px] text-warning">{stats.missing} fehlen noch</div>
        </div>
      </Card>

      {/* Fehlende Mounts Shortcut */}
      <Card
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => navigate('/mounts')}
      >
        <span className="font-semibold text-ink">⚠️ Fehlende Mounts anzeigen</span>
        <span className="text-ink-3">›</span>
      </Card>

      {/* Nach Erweiterung */}
      <section className="space-y-3">
        <SectionHeader title="Nach Erweiterung" />
        {EXPANSIONS.map((exp: Expansion) => {
          const e = stats.byExpansion[exp]
          if (!e || e.total === 0) return null
          return (
            <BreakdownRow
              key={exp}
              label={EXPANSION_SHORT[exp]}
              collected={e.collected}
              total={e.total}
            />
          )
        })}
      </section>

      {/* Nach Quelle */}
      <section className="space-y-3">
        <SectionHeader title="Nach Quelle" />
        {sources.map((src) => {
          const s = stats.bySource[src]
          if (!s || s.total === 0) return null
          return (
            <BreakdownRow
              key={src}
              label={SOURCE_LABEL[src]}
              collected={s.collected}
              total={s.total}
            />
          )
        })}
      </section>
    </div>
  )
}

function BreakdownRow({
  label,
  collected,
  total,
}: {
  label: string
  collected: number
  total: number
}) {
  return (
    <Card className="p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[15px] text-ink">{label}</span>
        <span className="text-[13px] text-ink-2">
          {collected}/{total}
        </span>
      </div>
      <ProgressBar progress={total > 0 ? collected / total : 0} />
    </Card>
  )
}
