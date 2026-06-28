import { useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import {
  EMPTY_FILTERS,
  SORT_LABEL,
  activeFilterCount,
  filterMounts,
  type CollectionFilter,
  type MountFilters,
  type SortKey,
} from '@/lib/search'
import { SearchBar } from '@/components/ui/SearchBar'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { MountRow } from '@/components/mount/MountRow'
import { FilterSheet } from '@/components/mount/FilterSheet'

const COLLECTION_TABS: { key: CollectionFilter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'collected', label: 'Gesammelt' },
  { key: 'missing', label: 'Fehlend' },
]

export function Mounts() {
  const { loading, mounts, collectedSet, favoritesSet } = useApp()
  const [filters, setFilters] = useState<MountFilters>(EMPTY_FILTERS)
  const [sheetOpen, setSheetOpen] = useState(false)

  const results = useMemo(
    () => filterMounts(mounts, filters, { collected: collectedSet, favorites: favoritesSet }),
    [mounts, filters, collectedSet, favoritesSet],
  )
  const activeCount = activeFilterCount(filters)

  return (
    <div className="space-y-3">
      <h1 className="pt-2 text-2xl font-bold text-ink">Mounts</h1>

      {/* Suche + Filter */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchBar
            value={filters.query}
            onChange={(query) => setFilters((f) => ({ ...f, query }))}
            placeholder="Mount suchen…"
          />
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="relative rounded-card bg-elevated p-2.5 text-gold"
          aria-label="Filter"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-black">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Schnellfilter */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {COLLECTION_TABS.map((t) => (
          <Chip
            key={t.key}
            label={t.label}
            active={filters.collection === t.key}
            onClick={() => setFilters((f) => ({ ...f, collection: t.key }))}
          />
        ))}
        <Chip
          label="★ Favoriten"
          active={filters.favoritesOnly}
          onClick={() => setFilters((f) => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
        />
      </div>

      {/* Trefferzeile + Sortierung */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-ink-2">{results.length} Mounts</span>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortKey }))}
          className="rounded-lg bg-elevated px-2 py-1 text-[13px] text-gold outline-none"
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <option key={k} value={k} className="bg-surface text-ink">
              {SORT_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="py-20 text-center text-ink-2">Lädt…</div>
      ) : results.length === 0 ? (
        <EmptyState
          title="Keine Mounts gefunden"
          message="Passe Suche oder Filter an."
          actionLabel={activeCount > 0 ? 'Filter zurücksetzen' : undefined}
          onAction={activeCount > 0 ? () => setFilters(EMPTY_FILTERS) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {results.map((m) => (
            <MountRow key={m.id} mount={m} />
          ))}
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
