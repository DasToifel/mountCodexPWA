/**
 * Kern-Datentypen der App.
 *
 * `Mount` ist der statische Katalog-Datensatz (aus JSON / später Addon-Sync).
 * Veränderlicher Nutzerzustand (Favorit, gesammelt, Notiz) wird NICHT hier,
 * sondern getrennt in IndexedDB anhand der `id` gespeichert. So bleibt der
 * Katalog klar vom Nutzerzustand getrennt und leicht aktualisierbar.
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export const RARITIES: Rarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
]

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Gewöhnlich',
  uncommon: 'Ungewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
}

/** Erweiterungen in Release-Reihenfolge (Index = Chronologie). */
export const EXPANSIONS = [
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
] as const

export type Expansion = (typeof EXPANSIONS)[number]

export const EXPANSION_SHORT: Record<Expansion, string> = {
  Classic: 'Classic',
  'The Burning Crusade': 'TBC',
  'Wrath of the Lich King': 'WotLK',
  Cataclysm: 'Cata',
  'Mists of Pandaria': 'MoP',
  'Warlords of Draenor': 'WoD',
  Legion: 'Legion',
  'Battle for Azeroth': 'BfA',
  Shadowlands: 'SL',
  Dragonflight: 'DF',
  'The War Within': 'TWW',
}

export type Faction = 'alliance' | 'horde' | 'neutral'

export const FACTION_LABEL: Record<Faction, string> = {
  alliance: 'Allianz',
  horde: 'Horde',
  neutral: 'Neutral',
}

export type SourceType =
  | 'drop'
  | 'vendor'
  | 'achievement'
  | 'profession'
  | 'quest'
  | 'event'
  | 'pvp'
  | 'worldBoss'
  | 'worldDrop'

export const SOURCE_LABEL: Record<SourceType, string> = {
  drop: 'Beute',
  vendor: 'Händler',
  achievement: 'Erfolg',
  profession: 'Beruf',
  quest: 'Quest',
  event: 'Event',
  pvp: 'PvP',
  worldBoss: 'Weltboss',
  worldDrop: 'Welt-Drop',
}

/** Kartenkoordinate (WoW-Stil: 0–100 innerhalb der Zone). */
export interface Coordinates {
  zone: string
  x: number
  y: number
}

/** Detaillierte Bezugsquelle. Optionale Felder bleiben weg, wenn irrelevant. */
export interface MountSource {
  type: SourceType
  boss?: string
  dungeon?: string
  raid?: string
  zone?: string
  continent?: string
  dropChance?: number // 0..1
  requirement?: string
  vendor?: string
  cost?: string
  profession?: string
  event?: string
  achievement?: string
  faction?: Faction
  coordinates?: Coordinates
}

export interface Mount {
  id: number // WoW-kompatible Mount-ID (für späteren Sync)
  name: string
  description: string
  image?: string // URL oder Asset-Pfad; fehlt → Platzhalter
  rarity: Rarity
  expansion: Expansion
  patch?: string
  faction: Faction
  sources: MountSource[]
  achievements: string[]
  notes?: string
  tags: string[]
}
