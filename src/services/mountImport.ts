/**
 * Import-Pipeline für Mount-Kataloge.
 *
 * Wandelt beliebiges (auch unvollständiges) JSON in saubere, vollständige
 * `Mount`-Objekte um. Das ist der zentrale Andockpunkt für JEDE Datenquelle:
 * gebündelte Test-JSON, manueller Datei-Import oder später der automatische
 * MountCodex-Addon-Export – alle laufen durch dieselbe Normalisierung.
 *
 * Designprinzipien:
 * - Defensiv: fehlende Felder bekommen sinnvolle Defaults, statt zu crashen.
 * - Verlustarm: unbekannte/ungültige Werte werden korrigiert + gesammelt
 *   als Warnung gemeldet (nicht still verschluckt).
 * - Skalierbar: rein funktional, O(n), keine versteckten Kosten – tauglich
 *   für 2000+ Mounts.
 */
import {
  EXPANSIONS,
  MOUNT_FILE_SCHEMA,
  RARITIES,
  type Expansion,
  type Faction,
  type Mount,
  type MountFile,
  type MountSource,
  type Rarity,
  type SourceType,
  SOURCE_LABEL,
} from '@/types/mount'

export interface ImportResult {
  mounts: Mount[]
  warnings: string[]
  meta: { total: number; imported: number; source?: string }
}

const RARITY_SET = new Set<string>(RARITIES)
const EXPANSION_SET = new Set<string>(EXPANSIONS)
const SOURCE_SET = new Set<string>(Object.keys(SOURCE_LABEL))
const FACTIONS = new Set<Faction>(['alliance', 'horde', 'neutral'])

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}
function asBool(v: unknown): boolean {
  return v === true
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function normalizeSource(raw: unknown): MountSource | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const type = SOURCE_SET.has(r.type as string)
    ? (r.type as SourceType)
    : 'worldDrop'
  const faction = FACTIONS.has(r.faction as Faction)
    ? (r.faction as Faction)
    : undefined

  let coordinates: MountSource['coordinates']
  if (r.coordinates && typeof r.coordinates === 'object') {
    const c = r.coordinates as Record<string, unknown>
    const x = asNumber(c.x)
    const y = asNumber(c.y)
    const zone = asString(c.zone)
    if (x != null && y != null && zone) coordinates = { zone, x, y }
  }

  return {
    type,
    boss: asString(r.boss),
    dungeon: asString(r.dungeon),
    raid: asString(r.raid),
    zone: asString(r.zone),
    continent: asString(r.continent),
    dropChance: asNumber(r.dropChance),
    requirement: asString(r.requirement),
    vendor: asString(r.vendor),
    cost: asString(r.cost),
    profession: asString(r.profession),
    event: asString(r.event),
    achievement: asString(r.achievement),
    faction,
    coordinates,
  }
}

/** Normalisiert einen einzelnen Roh-Datensatz zu einem vollständigen Mount. */
export function normalizeMount(
  raw: unknown,
  warnings: string[],
): Mount | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const id = asNumber(r.id)
  const name = asString(r.name)
  if (id == null || !name) {
    warnings.push(`Übersprungen: Datensatz ohne gültige id/name.`)
    return null
  }

  const rarity: Rarity = RARITY_SET.has(r.rarity as string)
    ? (r.rarity as Rarity)
    : 'rare'
  const expansion: Expansion = EXPANSION_SET.has(r.expansion as string)
    ? (r.expansion as Expansion)
    : 'Classic'
  const faction: Faction = FACTIONS.has(r.faction as Faction)
    ? (r.faction as Faction)
    : 'neutral'

  const rawSources = Array.isArray(r.sources) ? r.sources : []
  const sources = rawSources
    .map((s) => normalizeSource(s))
    .filter((s): s is MountSource => s !== null)

  if (sources.length === 0) {
    sources.push({ type: 'worldDrop' })
  }

  return {
    id,
    name,
    description: asString(r.description) ?? '',
    image: asString(r.image),
    rarity,
    expansion,
    patch: asString(r.patch),
    faction,
    sources,
    achievements: asStringArray(r.achievements),
    notes: asString(r.notes),
    tags: asStringArray(r.tags),
    flying: asBool(r.flying),
    ground: asBool(r.ground),
    aquatic: asBool(r.aquatic),
    special: asStringArray(r.special),
  }
}

/**
 * Parst & normalisiert eine komplette Katalog-Datei (`MountFile`) oder ein
 * nacktes Mount-Array. Dedupliziert nach id (letzter gewinnt).
 */
export function parseMountFile(data: unknown): ImportResult {
  const warnings: string[] = []

  let list: unknown[]
  let source: string | undefined

  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object') {
    const file = data as Partial<MountFile>
    if (file.schema && file.schema !== MOUNT_FILE_SCHEMA) {
      warnings.push(`Unbekanntes Schema "${file.schema}" – versuche trotzdem zu lesen.`)
    }
    list = Array.isArray(file.mounts) ? file.mounts : []
    source = file.source
  } else {
    return { mounts: [], warnings: ['Ungültiges Dateiformat.'], meta: { total: 0, imported: 0 } }
  }

  const byId = new Map<number, Mount>()
  for (const raw of list) {
    const mount = normalizeMount(raw, warnings)
    if (mount) byId.set(mount.id, mount)
  }

  return {
    mounts: [...byId.values()],
    warnings,
    meta: { total: list.length, imported: byId.size, source },
  }
}
