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

/** Vorberechneter, kleingeschriebener Suchindex eines Mounts. */
function searchIndex(m: Mount): string {
  return [
    m.name,
    m.description,
    ...m.tags,
    ...m.sources.flatMap((s) =>
      [s.boss, s.dungeon, s.raid, s.zone, s.vendor, s.event, s.profession].filter(
        Boolean,
      ),
    ),
  ]
    .join(' ')
    .toLowerCase()
}

function bestDropChance(m: Mount): number {
  return m.sources.reduce((max, s) => Math.max(max, s.dropChance ?? 0), 0)
}

export interface FilterContext {
  collected: Set<number>
  favorites: Set<number>
}

/** Wendet alle Filter + Sortierung an. */
export function filterMounts(
  mounts: Mount[],
  f: MountFilters,
  ctx: FilterContext,
): Mount[] {
  const q = f.query.trim().toLowerCase()
  let list = mounts.filter((m) => {
    if (q && !searchIndex(m).includes(q)) return false
    if (f.collection === 'collected' && !ctx.collected.has(m.id)) return false
    if (f.collection === 'missing' && ctx.collected.has(m.id)) return false
    if (f.favoritesOnly && !ctx.favorites.has(m.id)) return false
    if (f.expansions.size && !f.expansions.has(m.expansion)) return false
    if (f.rarities.size && !f.rarities.has(m.rarity)) return false
    if (f.sources.size && !m.sources.some((s) => f.sources.has(s.type))) return false
    return true
  })

  list = [...list].sort((a, b) => {
    switch (f.sort) {
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'rarity':
        return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]
      case 'expansion':
        return (
          EXPANSION_ORDER.indexOf(a.expansion) - EXPANSION_ORDER.indexOf(b.expansion)
        )
      case 'dropchance':
        return bestDropChance(b) - bestDropChance(a)
    }
  })

  return list
}

export function activeFilterCount(f: MountFilters): number {
  let n = 0
  if (f.collection !== 'all') n++
  if (f.favoritesOnly) n++
  n += f.expansions.size + f.sources.size + f.rarities.size
  return n
}
