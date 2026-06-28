/** Such-/Filterlogik für die Mount-Datenbank. Reine Funktionen. */
import type { Expansion, Mount, Rarity, SourceType } from '@/types/mount'

export type SortKey = 'name-asc' | 'name-desc' | 'rarity' | 'expansion' | 'dropchance'

export const SORT_LABEL: Record<SortKey, string> = {
  'name-asc': 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
  rarity: 'Seltenheit',
  expansion: 'Erweiterung',
  dropchance: 'Dropchance',
}

export type CollectionFilter = 'all' | 'collected' | 'missing'

export interface MountFilters {
  query: string
  sort: SortKey
  collection: CollectionFilter
  favoritesOnly: boolean
  expansions: Set<Expansion>
  sources: Set<SourceType>
  rarities: Set<Rarity>
}

export const EMPTY_FILTERS: MountFilters = {
  query: '',
  sort: 'name-asc',
  collection: 'all',
  favoritesOnly: false,
  expansions: new Set(),
  sources: new Set(),
  rarities: new Set(),
}

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
}

const EXPANSION_ORDER = [
  'Classic',
  'The Burning Crusade',
  'Wrath of the Lich King',
  'Cataclysm',
  'Mists of Pandaria',
  'Warlords of Draenor',
  'Legion',
  'Battle for Azeroth',
  'Shadowlands',
  'Dragonflight',
  'The War Within',
]

/**
 * Vorberechneter Sucheintrag: Haystack (lowercased) + bestDrop einmal pro
 * Mount berechnet, nicht bei jedem Tastendruck. Das macht die Live-Suche auch
 * bei tausenden Mounts schnell – O(n) Scan über bereits fertige Strings.
 */
export interface SearchEntry {
  mount: Mount
  haystack: string
  bestDrop: number
}

export function buildSearchEntries(mounts: Mount[]): SearchEntry[] {
  return mounts.map((m) => ({
    mount: m,
    haystack: [
      m.name,
      m.description,
      ...m.tags,
      ...m.special,
      ...m.sources.flatMap((s) =>
        [s.boss, s.dungeon, s.raid, s.zone, s.vendor, s.event, s.profession].filter(
          Boolean,
        ),
      ),
    ]
      .join(' ')
      .toLowerCase(),
    bestDrop: m.sources.reduce((max, s) => Math.max(max, s.dropChance ?? 0), 0),
  }))
}

export interface FilterContext {
  collected: Set<number>
  favorites: Set<number>
}

/** Wendet alle Filter + Sortierung über die vorberechneten Einträge an. */
export function filterEntries(
  entries: SearchEntry[],
  f: MountFilters,
  ctx: FilterContext,
): Mount[] {
  const q = f.query.trim().toLowerCase()
  const matched = entries.filter((e) => {
    if (q && !e.haystack.includes(q)) return false
    const m = e.mount
    if (f.collection === 'collected' && !ctx.collected.has(m.id)) return false
    if (f.collection === 'missing' && ctx.collected.has(m.id)) return false
    if (f.favoritesOnly && !ctx.favorites.has(m.id)) return false
    if (f.expansions.size && !f.expansions.has(m.expansion)) return false
    if (f.rarities.size && !f.rarities.has(m.rarity)) return false
    if (f.sources.size && !m.sources.some((s) => f.sources.has(s.type))) return false
    return true
  })

  const list = matched
    .sort((ea, eb) => sortCompare(ea, eb, f.sort))
    .map((e) => e.mount)
  return list
}

function sortCompare(ea: SearchEntry, eb: SearchEntry, sort: SortKey): number {
  const a = ea.mount
  const b = eb.mount
  switch (sort) {
    case 'name-asc':
      return a.name.localeCompare(b.name)
    case 'name-desc':
      return b.name.localeCompare(a.name)
    case 'rarity':
      return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]
    case 'expansion':
      return EXPANSION_ORDER.indexOf(a.expansion) - EXPANSION_ORDER.indexOf(b.expansion)
    case 'dropchance':
      return eb.bestDrop - ea.bestDrop
  }
}

export function activeFilterCount(f: MountFilters): number {
  let n = 0
  if (f.collection !== 'all') n++
  if (f.favoritesOnly) n++
  n += f.expansions.size + f.sources.size + f.rarities.size
  return n
}
