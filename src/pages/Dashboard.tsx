import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { computeStats, mountOfTheDay } from '@/lib/stats'
import { greeting, toPercent } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { StatTile } from '@/components/ui/StatTile'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { MountCard } from '@/components/mount/MountCard'
import { MountImage } from '@/components/mount/MountImage'
import { RarityBadge } from '@/components/mount/RarityBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EXPANSIONS, EXPANSION_SHORT, SOURCE_LABEL, type SourceType } from '@/types/mount'
import type { Breakdown } from '@/lib/stats'

export function Dashboard() {
  const { loading, mounts, collectedSet, favoritesSet, userState } = useApp()
  const navigate = useNavigate()
  const [name] = useLocalStorage('mc.name', 'Abenteurer')

  const stats = useMemo(
    () => computeStats(mounts, collectedSet),
    [mounts, collectedSet],
  )
  const daily = useMemo(() => mountOfTheDay(mounts), [mounts])
  const favorites = useMemo(
    () => mounts.filter((m) => favoritesSet.has(m.id)),
    [mounts, favoritesSet],
  )
  const recent = useMemo(
    () =>
      userState.recent
        .map((id) => mounts.find((m) => m.id === id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m)),
    [userState.recent, mounts],
  )

  if (loading) {
    return <div className="py-20 text-center text-ink-2">Lädt…</div>
  }

  const motivation =
    stats.missing === 0
      ? 'Alle Mounts gesammelt – legendär! 🏆'
      : `Noch ${stats.missing} Mounts bis zur Vollständigkeit.`

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <header className="pt-2">
        <h1 className="text-3xl font-bold text-ink">{greeting(name)}</h1>
        <p className="mt-1 text-sm text-ink-2">{motivation}</p>
      </header>

      {/* Gesamtfortschritt */}
      <Card className="flex items-center gap-5 p-4">
        <ProgressRing progress={stats.progress} size={112}>
          <span className="text-2xl font-bold text-ink">
            {toPercent(stats.progress)}%
          </span>
          <span className="text-[11px] text-ink-2">gesammelt</span>
        </ProgressRing>
        <div>
          <div className="font-semibold text-ink">Gesamtfortschritt</div>
          <div className="text-sm text-ink-2">
            {stats.collected} von {stats.total} Mounts
          </div>
          <button
            onClick={() => navigate('/collection')}
            className="mt-2 text-[13px] font-medium text-gold"
          >
            Statistiken ansehen →
          </button>
        </div>
      </Card>

      {/* Kennzahlen */}
      <div className="flex gap-3">
        <StatTile
          value={stats.collected}
          label="Gesammelt"
          tint="text-success"
          icon={<Glyph d="m5 12 5 5L20 7" />}
        />
        <StatTile
          value={stats.missing}
          label="Fehlend"
          tint="text-warning"
          icon={<Glyph d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 15v.01M12 7v6" />}
        />
        <StatTile
          value={favorites.length}
          label="Favoriten"
          tint="text-gold"
          icon={<Glyph d="m12 3 2.9 6 6.1.5-4.6 4 1.4 6L12 16.8 6.2 19.5l1.4-6L3 9.5 9.1 9 12 3Z" />}
        />
      </div>

      {/* Mount des Tages */}
      {daily && (
        <section className="space-y-3">
          <SectionHeader title="Mount des Tages" />
          <Card
            elevated
            className="flex cursor-pointer items-center gap-4 p-4"
            onClick={() => navigate(`/mounts/${daily.id}`)}
          >
            <MountImage
              src={daily.image}
              alt={daily.name}
              rarity={daily.rarity}
              className="h-20 w-20 shrink-0"
            />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold text-ink">{daily.name}</div>
              <div className="mt-1 flex items-center gap-2">
                <RarityBadge rarity={daily.rarity} />
                <span className="text-[13px] text-ink-2">
                  {EXPANSION_SHORT[daily.expansion]}
                </span>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Schnellzugriffe */}
      <section className="space-y-3">
        <SectionHeader title="Schnellzugriff" />
        <div className="flex gap-3">
          <QuickButton label="Alle Mounts" onClick={() => navigate('/mounts')} d="M4 5h16v4H4V5Zm0 6h16v8H4v-8Z" />
          <QuickButton label="Routen" onClick={() => navigate('/routes')} d="m9 3 6 2 5-2v16l-5 2-6-2-5 2V5l5-2Z" />
          <QuickButton label="Sammlung" onClick={() => navigate('/collection')} d="M12 2a10 10 0 1 0 10 10h-10V2Z" />
        </div>
      </section>

      {/* Erweiterungsübersicht */}
      <OverviewSection
        title="Erweiterungen"
        entries={EXPANSIONS.map((e) => ({
          label: EXPANSION_SHORT[e],
          data: stats.byExpansion[e],
        }))}
        onAll={() => navigate('/collection')}
      />

      {/* Quellenübersicht */}
      <OverviewSection
        title="Quellen"
        entries={(Object.keys(SOURCE_LABEL) as SourceType[]).map((s) => ({
          label: SOURCE_LABEL[s],
          data: stats.bySource[s],
        }))}
        onAll={() => navigate('/collection')}
      />

      {/* Favoriten */}
      {favorites.length > 0 && (
        <Carousel title="Favoriten" items={favorites} />
      )}

      {/* Zuletzt angesehen */}
      {recent.length > 0 && (
        <Carousel title="Zuletzt angesehen" items={recent} />
      )}
    </div>
  )
}

function Carousel({ title, items }: { title: string; items: import('@/types/mount').Mount[] }) {
  return (
    <section className="space-y-3">
      <SectionHeader title={title} />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
        {items.map((m) => (
          <MountCard key={m.id} mount={m} />
        ))}
      </div>
    </section>
  )
}

function OverviewSection({
  title,
  entries,
  onAll,
}: {
  title: string
  entries: { label: string; data?: Breakdown }[]
  onAll: () => void
}) {
  const present = entries
    .filter((e): e is { label: string; data: Breakdown } => Boolean(e.data && e.data.total > 0))
    .sort((a, b) => b.data.total - a.data.total)
    .slice(0, 5)

  if (present.length === 0) return null

  return (
    <section className="space-y-3">
      <SectionHeader title={title} actionLabel="Alle" onAction={onAll} />
      <Card className="space-y-3 p-4">
        {present.map(({ label, data }) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[14px] text-ink">{label}</span>
              <span className="text-[12px] text-ink-2">
                {data.collected}/{data.total}
              </span>
            </div>
            <ProgressBar progress={data.total > 0 ? data.collected / data.total : 0} />
          </div>
        ))}
      </Card>
    </section>
  )
}

function QuickButton({
  label,
  onClick,
  d,
}: {
  label: string
  onClick: () => void
  d: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-2 rounded-card border border-separator bg-surface py-4 active:bg-elevated"
    >
      <span className="text-gold">
        <Glyph d={d} />
      </span>
      <span className="text-[13px] text-ink">{label}</span>
    </button>
  )
}

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
