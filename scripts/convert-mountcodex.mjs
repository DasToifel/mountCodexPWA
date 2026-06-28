/**
 * MountCodex: Konverter Addon (Lua) → PWA (JSON).
 *
 * Liest die echten Datentabellen des WoW-Addons und erzeugt daraus
 * `public/data/mounts.json` im Format `mountcodex/mounts`. So zeigt die PWA
 * ausschließlich Daten aus der bestehenden MountCodex-Datenbank – keine
 * erfundenen Mounts. Wird der Addon-Inhalt aktualisiert, einfach erneut laufen.
 *
 * Gelesene Dateien (im Addon-Ordner):
 *   - MountCodexMountDB.lua    → MC_MOUNT_DB["name"] + MC_MOUNT_DB.ids["mount:N"]
 *   - MountCodexExpansionDB.lua→ ns.MountExpansionDB[mountID] = "Erweiterung"
 *   - MountCodexPatchDB.lua    → ns.MountPatchDB[mountID]     = "Patch"
 *
 * Anzeigenamen der id-basierten Einträge ("mount:N") liefert im Addon das Spiel
 * (C_MountJournal) – sie stehen NICHT in den Dateien. Daher:
 *   - Standard: nur Einträge MIT Namen (Legacy-Namens-DB + optionale Namensliste).
 *   - Mit --include-unnamed werden auch id-Einträge ohne Namen aufgenommen
 *     (Anzeige "Reittier #N"), bereit zum späteren Nachbenennen.
 *
 * Optionale Namensliste (aus dem Addon im Spiel exportierbar):
 *   scripts/mountcodex-names.json  =>  { "2505": "Echter Name", ... }
 *
 * Aufruf:
 *   node scripts/convert-mountcodex.mjs [--addon "<Pfad zum Addon-Ordner>"] [--include-unnamed]
 */
import { readFile, writeFile, access } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

// --- Argumente ---
const args = process.argv.slice(2)
const includeUnnamed = args.includes('--include-unnamed')
const addonArgIdx = args.indexOf('--addon')
const DEFAULT_ADDON =
  'D:/Blizzard/World of Warcraft/_retail_/Interface/AddOns/MountCodex'
const addonDir = addonArgIdx >= 0 ? args[addonArgIdx + 1] : DEFAULT_ADDON

// --- ID-Schemata (kollisionsfrei + stabil für Nutzerzustand) ---
const SPELL_OFFSET = 1_000_000_000 // spell:N  -> 1e9 + N
const NAME_OFFSET = 2_000_000_000 // Legacy-Name -> 2e9 + hash

function hash32(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0
  return h
}

// --- Mappings ---
const KNOWN_EXPANSIONS = new Set([
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
  'Midnight',
])

function mapExpansion(raw) {
  if (raw && KNOWN_EXPANSIONS.has(raw)) return raw
  return 'Classic' // "Unknown"/unbekannt → neutraler Default
}

function mapFaction(raw) {
  const f = (raw || '').toLowerCase()
  if (f === 'alliance' || f === 'allianz') return 'alliance'
  if (f === 'horde') return 'horde'
  return 'neutral'
}

/** Leitet aus dem deutschen Quellentext den Quellentyp ab. */
function mapSourceType(source = '') {
  const s = source.toLowerCase()
  if (/(pvp|arena|schlachtfeld|wertung|saison|gladiator|ehre)/.test(s)) return 'pvp'
  if (/(erfolg)/.test(s)) return 'achievement'
  if (/(beruf|hergestellt|herstellung|ingenieur|schmied)/.test(s)) return 'profession'
  if (/(händler|verkäuf|verkauf|kauf|ruf)/.test(s)) return 'vendor'
  if (/(weltboss)/.test(s)) return 'worldBoss'
  if (/(weltereignis|event|jahrmarkt|dunkelmond|feiertag|nobelgarten|liebe)/.test(s))
    return 'event'
  if (/(quest)/.test(s)) return 'quest'
  if (/(weltbeute|weltdrop|welt-)/.test(s)) return 'worldDrop'
  if (/(beute|droppt|drop|trash|raid|schlachtzug|dungeon)/.test(s)) return 'drop'
  return 'worldDrop'
}

// --- Lua-Parser (auf die konkreten, regelmäßigen Formate zugeschnitten) ---

/** Extrahiert Skalarfelder (key="str" oder key=zahl) aus einem `{...}`-Body. */
function parseFields(body) {
  const out = {}
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|([\d.]+))/g
  let m
  while ((m = re.exec(body))) {
    out[m[1]] = m[2] !== undefined ? m[2] : Number(m[3])
  }
  return out
}

function parseMountDB(text) {
  const legacy = [] // { name, fields }
  const byId = [] // { kind, id, fields }

  // Legacy: ["name"]={ ... },  (einzeilig)
  const legacyRe = /^\s*\["([^"]+)"\]\s*=\s*\{([^}]*)\}/gm
  let m
  while ((m = legacyRe.exec(text))) {
    legacy.push({ name: m[1], fields: parseFields(m[2]) })
  }

  // IDs: MC_MOUNT_DB.ids["mount:N"] = { ... }
  const idRe = /MC_MOUNT_DB\.ids\["(mount|spell):(\d+)"\]\s*=\s*\{([^}]*)\}/g
  while ((m = idRe.exec(text))) {
    byId.push({ kind: m[1], id: Number(m[2]), fields: parseFields(m[3]) })
  }

  return { legacy, byId }
}

/** Parst `[N] = "Wert"` Tabellen (Expansion-/Patch-DB). */
function parseNumKeyedTable(text) {
  const map = new Map()
  const re = /\[(\d+)\]\s*=\s*"([^"]*)"/g
  let m
  while ((m = re.exec(text))) map.set(Number(m[1]), m[2])
  return map
}

// --- Hilfen ---
function titleCase(name) {
  return name.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function buildSource(fields, fallbackExpansion) {
  const src = {
    type: mapSourceType(fields.source),
    boss: fields.boss && fields.boss !== '-' ? fields.boss : undefined,
    zone: fields.zone && fields.zone !== '-' ? fields.zone : undefined,
    requirement: fields.source || undefined,
    faction: fields.faction ? mapFaction(fields.faction) : undefined,
  }
  void fallbackExpansion
  return src
}

function makeMount({ id, name, fields, expansion, patch, traceTag }) {
  return {
    id,
    name,
    description: '',
    rarity: 'rare', // Seltenheit nicht in der Addon-DB → neutraler Default
    expansion: mapExpansion(expansion || fields.expansion),
    patch: patch || undefined,
    faction: mapFaction(fields.faction),
    flying: false,
    ground: false,
    aquatic: false,
    special: [],
    sources: [buildSource(fields)],
    achievements: /erfolg/i.test(fields.source || '') && fields.boss ? [fields.boss] : [],
    notes: undefined,
    tags: [traceTag].filter(Boolean),
  }
}

async function main() {
  // Dateien lesen
  const mountDBPath = join(addonDir, 'MountCodexMountDB.lua')
  if (!(await exists(mountDBPath))) {
    console.error(`\n✗ Addon nicht gefunden: ${mountDBPath}`)
    console.error(`  Pfad per --addon "<Ordner>" angeben.\n`)
    process.exit(1)
  }

  const mountText = await readFile(mountDBPath, 'utf8')
  const expText = (await exists(join(addonDir, 'MountCodexExpansionDB.lua')))
    ? await readFile(join(addonDir, 'MountCodexExpansionDB.lua'), 'utf8')
    : ''
  const patchText = (await exists(join(addonDir, 'MountCodexPatchDB.lua')))
    ? await readFile(join(addonDir, 'MountCodexPatchDB.lua'), 'utf8')
    : ''

  const { legacy, byId } = parseMountDB(mountText)
  const expansionByMountId = parseNumKeyedTable(expText)
  const patchByMountId = parseNumKeyedTable(patchText)

  // Optionale Namensliste
  let names = {}
  const namesPath = join(__dirname, 'mountcodex-names.json')
  if (await exists(namesPath)) {
    try {
      const raw = JSON.parse(await readFile(namesPath, 'utf8'))
      names =
        raw && typeof raw === 'object' && raw.names && typeof raw.names === 'object'
          ? raw.names
          : raw
    } catch {
      console.warn('⚠ mountcodex-names.json konnte nicht gelesen werden – ignoriert.')
    }
  }

  const mounts = []
  const seen = new Set()
  let unnamedSkipped = 0

  // 1) Legacy-Namens-Einträge (echte Namen vorhanden)
  for (const { name, fields } of legacy) {
    const id = NAME_OFFSET + (hash32(name) % 100_000_000)
    if (seen.has(id)) continue
    seen.add(id)
    mounts.push(
      makeMount({
        id,
        name: titleCase(name),
        fields,
        expansion: fields.expansion,
        patch: undefined,
        traceTag: 'quelle:addon-name',
      }),
    )
  }

  // 2) ID-basierte Einträge (Name aus optionaler Liste, sonst optional)
  for (const { kind, id: rawId, fields } of byId) {
    const id = kind === 'spell' ? SPELL_OFFSET + rawId : rawId
    if (seen.has(id)) continue

    const resolvedName =
      names[String(rawId)]?.name ?? names[String(rawId)] ?? null

    if (!resolvedName && !includeUnnamed) {
      unnamedSkipped++
      continue
    }

    seen.add(id)
    mounts.push(
      makeMount({
        id,
        name: resolvedName || `Reittier #${rawId}`,
        fields,
        expansion: fields.expansion || expansionByMountId.get(rawId),
        patch: patchByMountId.get(rawId),
        traceTag: resolvedName ? `quelle:addon-id` : 'unbenannt',
      }),
    )
  }

  mounts.sort((a, b) => a.name.localeCompare(b.name))

  const output = {
    schema: 'mountcodex/mounts',
    version: 1,
    source: 'mountcodex-addon',
    generatedAt: new Date().toISOString().slice(0, 10),
    mounts,
  }

  const outPath = join(projectRoot, 'public', 'data', 'mounts.json')
  await writeFile(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8')

  console.log('MountCodex Lua → JSON')
  console.log(`  Legacy-Namens-Einträge: ${legacy.length}`)
  console.log(`  ID-Einträge:            ${byId.length}`)
  console.log(`  Namensliste:            ${Object.keys(names).length} Einträge`)
  if (!includeUnnamed && unnamedSkipped > 0) {
    console.log(`  Übersprungen (ohne Namen): ${unnamedSkipped}  → --include-unnamed zum Aufnehmen`)
  }
  console.log(`  ✓ Geschrieben: ${mounts.length} Mounts → ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
