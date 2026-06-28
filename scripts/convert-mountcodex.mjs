/**
 * MountCodex: Konverter Addon (Lua) → PWA (JSON).
 *
 * Führt ALLE statischen Mount-Datentabellen des WoW-Addons automatisch zusammen
 * und erzeugt `public/data/mounts.json`. Die PWA zeigt damit ausschließlich
 * Daten aus der bestehenden MountCodex-Datenbank – keine erfundenen Mounts,
 * kein manuelles Kopieren. Bei Addon-Updates einfach erneut laufen lassen.
 *
 * Gelesene Dateien (im Addon-Ordner):
 *   - MountCodexMountDB.lua     → MC_MOUNT_DB["name"] + MC_MOUNT_DB.ids["mount:N"|"spell:N"]
 *                                 Felder: expansion, source, zone, boss, faction, npcID …
 *   - MountCodexExpansionDB.lua → ns.MountExpansionDB[mountID] = "Erweiterung"
 *   - MountCodexPatchDB.lua     → ns.MountPatchDB[mountID]     = "Patch"
 *
 * NICHT in den statischen Dateien (im Addon live über C_MountJournal geholt):
 *   name (für id-Einträge), icon, description, displayId. → leer/null gelassen.
 *   continent, instance, coordinates sind in der Mount-DB ebenfalls nicht
 *   vorhanden. spellId nur für "spell:N"-Einträge bekannt.
 *
 * Optionale Namensliste (aus dem Addon im Spiel exportierbar):
 *   scripts/mountcodex-names.json  =>  { "2505": "Name" }  oder
 *                                      { "2505": { "name": "...", "icon": "...", "spellId": 123 } }
 *
 * Aufruf:
 *   node scripts/convert-mountcodex.mjs [--addon "<Pfad>"] [--named-only]
 */
import { readFile, writeFile, access, mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

const args = process.argv.slice(2)
const namedOnly = args.includes('--named-only')
const addonArgIdx = args.indexOf('--addon')
const exportArgIdx = args.indexOf('--export')
const exportPath = exportArgIdx >= 0 ? args[exportArgIdx + 1] : null
const DEFAULT_ADDON =
  'D:/Blizzard/World of Warcraft/_retail_/Interface/AddOns/MountCodex'
const addonDir = addonArgIdx >= 0 ? args[addonArgIdx + 1] : DEFAULT_ADDON

// ID-Schema: kollisionsfrei + stabil (für persistenten Nutzerzustand).
const SPELL_OFFSET = 1_000_000_000 // spell:N      -> 1e9 + N
const NAME_OFFSET = 2_000_000_000 // Legacy-Name -> 2e9 + hash

function hash32(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0
  return h
}

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

const mapExpansion = (raw) => (raw && KNOWN_EXPANSIONS.has(raw) ? raw : 'Classic')

function mapFaction(raw) {
  const f = (raw || '').toLowerCase()
  if (f === 'alliance' || f === 'allianz') return 'alliance'
  if (f === 'horde') return 'horde'
  return 'neutral'
}

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

/** Skalarfelder (key="str" | key=zahl) aus einem `{...}`-Body extrahieren. */
function parseFields(body) {
  const out = {}
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|([\d.]+))/g
  let m
  while ((m = re.exec(body))) out[m[1]] = m[2] !== undefined ? m[2] : Number(m[3])
  return out
}

function parseMountDB(text) {
  const legacy = []
  const byId = []
  const legacyRe = /^\s*\["([^"]+)"\]\s*=\s*\{([^}]*)\}/gm
  let m
  while ((m = legacyRe.exec(text))) legacy.push({ name: m[1], fields: parseFields(m[2]) })
  const idRe = /MC_MOUNT_DB\.ids\["(mount|spell):(\d+)"\]\s*=\s*\{([^}]*)\}/g
  while ((m = idRe.exec(text)))
    byId.push({ kind: m[1], num: Number(m[2]), fields: parseFields(m[3]) })
  return { legacy, byId }
}

function parseNumKeyedTable(text) {
  const map = new Map()
  const re = /\[(\d+)\]\s*=\s*"([^"]*)"/g
  let m
  while ((m = re.exec(text))) map.set(Number(m[1]), m[2])
  return map
}

const titleCase = (s) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
const clean = (v) => (v && v !== '-' ? v : null)

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

/**
 * Baut einen Mount im flachen PWA-Schema. Felder, die das Addon statisch nicht
 * kennt (icon, continent, instance, description, coordinates), bleiben null/leer.
 */
function makeMount({ id, name, spellId, fields, expansion, patch }) {
  const sourceText = clean(fields.source)
  const boss = clean(fields.boss)
  const type = mapSourceType(fields.source)

  // Händler/Event/Beruf aus den vorhandenen Feldern ableiten (kein Erfinden):
  // Das Boss-Feld trägt bei diesen Quellen i. d. R. den Händler-/Beruf-/Event-Namen.
  const vendor = type === 'vendor' ? boss || sourceText : null
  const profession = type === 'profession' ? boss || sourceText : null
  const event = type === 'event' ? boss || sourceText : null

  // Statisch nicht vorhanden:
  const missing = ['icon', 'continent', 'coordinates']

  return {
    mount: {
      id,
      name,
      spellId: spellId ?? null,
      icon: null,
      iconFileId: null,
      expansion: mapExpansion(expansion || fields.expansion),
      continent: null,
      zone: clean(fields.zone),
      source: sourceText,
      sourceType: type,
      boss,
      instance: null,
      vendor,
      profession,
      event,
      patch: patch || null,
      rarity: null, // in der WoW-API/Addon-DB nicht vorhanden
      description: '',
      coordinates: null,
      faction: mapFaction(fields.faction),
      collected: false,
      favorite: false,
    },
    missing,
  }
}

/**
 * Wandelt einen Lua-String-Literal-Inhalt zurück in echten Text.
 * WoW-SavedVariables escapen Nicht-ASCII als `\ddd` (dezimale BYTES) – daher
 * auf Byte-Ebene sammeln und als UTF-8 dekodieren (korrekte Umlaute).
 */
function unescapeLuaString(s) {
  const bytes = []
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '\\') {
      const next = s[i + 1]
      const dec = s.slice(i + 1).match(/^\d{1,3}/)
      if (dec) {
        bytes.push(parseInt(dec[0], 10) & 0xff)
        i += dec[0].length
      } else {
        const map = { n: 10, r: 13, t: 9, a: 7, b: 8, f: 12, v: 11 }
        bytes.push(map[next] ?? next.charCodeAt(0)) // \\ \" usw.
        i += 1
      }
    } else {
      // Rohzeichen (ggf. mehrbyte UTF-8) korrekt in Bytes zerlegen.
      const enc = Buffer.from(ch, 'utf8')
      for (const b of enc) bytes.push(b)
    }
  }
  return Buffer.from(bytes).toString('utf8')
}

/**
 * Export-Modus: liest die vom Addon erzeugte SavedVariable
 * `MountCodexExportJSON = "...."` und schreibt deren JSON direkt als mounts.json.
 * Das ist der bevorzugte Weg – fertige Live-Daten (Namen, Icons, gesammelt).
 */
async function runExportMode(savedVarsPath) {
  if (!(await exists(savedVarsPath))) {
    console.error(`\n✗ Export-Datei nicht gefunden: ${savedVarsPath}\n`)
    process.exit(1)
  }
  const raw = await readFile(savedVarsPath, 'utf8')
  const m = raw.match(/MountCodexExportJSON\s*=\s*"([\s\S]*?)"\s*(?:\r?\n|$)/)
  if (!m) {
    console.error('\n✗ MountCodexExportJSON in der Datei nicht gefunden. Erst /mcexport + /reload im Spiel.\n')
    process.exit(1)
  }
  const jsonText = unescapeLuaString(m[1])
  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch (e) {
    console.error('\n✗ Eingebettetes JSON ist ungültig:', e.message, '\n')
    process.exit(1)
  }

  const mounts = Array.isArray(parsed.mounts) ? parsed.mounts : []

  // Icon-Namen aus FileDataID auflösen (für Wowhead-Anzeige in der PWA).
  const iconMap = await loadIconMap()
  let iconResolved = 0
  for (const x of mounts) {
    const fid = x.iconFileId ?? x.iconFileID
    if (!x.icon && fid != null && iconMap[String(fid)]) {
      x.icon = iconMap[String(fid)]
      iconResolved++
    }
  }

  const collected = mounts.filter((x) => x.collected).length
  const withIcon = mounts.filter((x) => x.icon || x.iconFileId || x.iconFileID).length
  const outDir = join(projectRoot, 'public', 'data')
  await mkdir(outDir, { recursive: true })
  const outPath = join(outDir, 'mounts.json')
  await writeFile(outPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8')

  console.log('MountCodex Export (SavedVariables) → JSON')
  console.log(`  Quelle: ${savedVarsPath}`)
  console.log(`  Mounts: ${mounts.length}`)
  console.log(`  Mit Icon: ${withIcon} (Namen aufgelöst: ${iconResolved})`)
  console.log(`  Gesammelt: ${collected} | Fehlend: ${mounts.length - collected}`)
  console.log(`  ✓ Geschrieben: ${outPath}`)
}

/** Lädt die fileDataID→Icon-Name-Map (Community-Listfile, einmalig erzeugt). */
async function loadIconMap() {
  const p = join(__dirname, 'icons-map.json')
  if (!(await exists(p))) {
    console.warn('⚠ scripts/icons-map.json fehlt – Icons werden nicht aufgelöst.')
    return {}
  }
  try {
    return JSON.parse(await readFile(p, 'utf8'))
  } catch {
    return {}
  }
}

async function main() {
  if (exportPath) {
    await runExportMode(exportPath)
    return
  }

  const mountDBPath = join(addonDir, 'MountCodexMountDB.lua')
  if (!(await exists(mountDBPath))) {
    console.error(`\n✗ Addon nicht gefunden: ${mountDBPath}\n  Pfad per --addon "<Ordner>" angeben.\n`)
    process.exit(1)
  }

  const usedFiles = ['MountCodexMountDB.lua']
  const mountText = await readFile(mountDBPath, 'utf8')

  let expText = ''
  if (await exists(join(addonDir, 'MountCodexExpansionDB.lua'))) {
    expText = await readFile(join(addonDir, 'MountCodexExpansionDB.lua'), 'utf8')
    usedFiles.push('MountCodexExpansionDB.lua')
  }
  let patchText = ''
  if (await exists(join(addonDir, 'MountCodexPatchDB.lua'))) {
    patchText = await readFile(join(addonDir, 'MountCodexPatchDB.lua'), 'utf8')
    usedFiles.push('MountCodexPatchDB.lua')
  }

  const { legacy, byId } = parseMountDB(mountText)
  const expansionByMountId = parseNumKeyedTable(expText)
  const patchByMountId = parseNumKeyedTable(patchText)

  // Optionale Namensliste (id → Name/Icon/SpellId).
  let names = {}
  const namesPath = join(__dirname, 'mountcodex-names.json')
  if (await exists(namesPath)) {
    try {
      const raw = JSON.parse(await readFile(namesPath, 'utf8'))
      names = raw?.names && typeof raw.names === 'object' ? raw.names : raw
      usedFiles.push('scripts/mountcodex-names.json')
    } catch {
      console.warn('⚠ mountcodex-names.json unlesbar – ignoriert.')
    }
  }

  const mounts = []
  const seen = new Set()
  const fieldMissing = {}
  let unnamed = 0

  const track = (missing) => {
    for (const f of missing) fieldMissing[f] = (fieldMissing[f] || 0) + 1
  }

  // 1) Legacy-Namens-Einträge (echte Namen)
  for (const { name, fields } of legacy) {
    const id = NAME_OFFSET + (hash32(name) % 100_000_000)
    if (seen.has(id)) continue
    seen.add(id)
    const { mount, missing } = makeMount({
      id,
      name: titleCase(name),
      spellId: null,
      fields,
      expansion: fields.expansion,
      patch: null,
    })
    track(['name', ...missing].filter((f) => f !== 'name'))
    mounts.push(mount)
  }

  // 2) ID-basierte Einträge
  for (const { kind, num, fields } of byId) {
    const id = kind === 'spell' ? SPELL_OFFSET + num : num
    if (seen.has(id)) continue

    const nameEntry = names[String(num)]
    const resolvedName =
      (typeof nameEntry === 'object' ? nameEntry.name : nameEntry) || null
    const resolvedSpellId =
      kind === 'spell' ? num : typeof nameEntry === 'object' ? (nameEntry.spellId ?? null) : null

    if (!resolvedName) {
      unnamed++
      if (namedOnly) continue
    }

    seen.add(id)
    const { mount, missing } = makeMount({
      id,
      name: resolvedName || `Reittier #${num}`,
      spellId: resolvedSpellId,
      fields,
      expansion: fields.expansion || expansionByMountId.get(num),
      patch: patchByMountId.get(num) || null,
    })
    track(missing)
    if (!resolvedName) fieldMissing.name = (fieldMissing.name || 0) + 1
    mounts.push(mount)
  }

  // 3) Mounts, die NUR in der Expansion-/Patch-DB stehen (kein MountDB-Eintrag).
  //    Vorher wurden sie ignoriert → das war der Hauptgrund für "nur ~1140".
  //    Keine künstliche Filterung: jede bekannte mountID kommt rein.
  let fromExpPatchOnly = 0
  const allMountIds = new Set([...expansionByMountId.keys(), ...patchByMountId.keys()])
  for (const num of allMountIds) {
    if (seen.has(num)) continue // bereits als mount:N vorhanden
    seen.add(num)
    const nameEntry = names[String(num)]
    const resolvedName =
      (typeof nameEntry === 'object' ? nameEntry.name : nameEntry) || null
    if (!resolvedName) {
      unnamed++
      fieldMissing.name = (fieldMissing.name || 0) + 1
      if (namedOnly) continue
    }
    const { mount, missing } = makeMount({
      id: num,
      name: resolvedName || `Reittier #${num}`,
      spellId: typeof nameEntry === 'object' ? (nameEntry.spellId ?? null) : null,
      fields: {}, // keine Quellen-Metadaten vorhanden
      expansion: expansionByMountId.get(num),
      patch: patchByMountId.get(num) || null,
    })
    track(missing)
    mounts.push(mount)
    fromExpPatchOnly++
  }

  mounts.sort((a, b) => a.name.localeCompare(b.name))

  const output = {
    schema: 'mountcodex/mounts',
    version: 1,
    source: 'mountcodex-addon',
    generatedAt: new Date().toISOString().slice(0, 10),
    mounts,
  }

  const outDir = join(projectRoot, 'public', 'data')
  await mkdir(outDir, { recursive: true })
  const outPath = join(outDir, 'mounts.json')
  await writeFile(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8')

  console.log('MountCodex Lua → JSON')
  console.log('  Dateien:', usedFiles.join(', '))
  console.log(`  Legacy-Namens-Einträge: ${legacy.length}`)
  console.log(`  ID-Einträge:            ${byId.length}`)
  console.log(`  Nur in Expansion-/PatchDB: ${fromExpPatchOnly}`)
  console.log(`  Ohne Namen:             ${unnamed}${namedOnly ? ' (ausgeschlossen via --named-only)' : ' (als "Reittier #N" aufgenommen)'}`)
  console.log('  Fehlende Felder (Anzahl Mounts):', fieldMissing)
  console.log(`  ✓ Geschrieben: ${mounts.length} Mounts → ${outPath}`)
  console.log('  Hinweis: Icon/collected nur via /mcexport (C_MountJournal).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
