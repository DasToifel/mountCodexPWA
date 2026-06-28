/**
 * IndexedDB-Persistenz für den Nutzerzustand (Favoriten, gesammelt, Notizen,
 * Verlauf). IndexedDB statt LocalStorage: asynchron (blockiert UI nicht),
 * größere Kapazität, robust für späteren Sync größerer Datenmengen.
 *
 * Gekapselt über `idb` (winziger Promise-Wrapper). Nach außen nur
 * `loadUserState` / `saveUserState` – der Rest der App kennt IndexedDB nicht.
 */
import { openDB, type IDBPDatabase } from 'idb'
import { EMPTY_USER_STATE, type UserState } from '@/types/userState'
import type { Mount } from '@/types/mount'

const DB_NAME = 'mountcodex'
const DB_VERSION = 2
const STORE = 'kv' // Nutzerzustand (klein)
const CATALOG = 'catalog' // importierter Mount-Katalog (potenziell groß)
const STATE_KEY = 'userState'
const CATALOG_KEY = 'mounts'
const CATALOG_META_KEY = 'meta'

export interface CatalogMeta {
  count: number
  importedAt: string
  source?: string
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE)
        }
        // v2: eigener Store für den Katalog (getrennt vom Nutzerzustand).
        if (!db.objectStoreNames.contains(CATALOG)) {
          db.createObjectStore(CATALOG)
        }
      },
    })
  }
  return dbPromise
}

export async function loadUserState(): Promise<UserState> {
  try {
    const db = await getDB()
    const stored = (await db.get(STORE, STATE_KEY)) as UserState | undefined
    // Mit Default mergen → robust gegen künftige neue Felder.
    return { ...EMPTY_USER_STATE, ...(stored ?? {}) }
  } catch {
    return EMPTY_USER_STATE
  }
}

export async function saveUserState(state: UserState): Promise<void> {
  try {
    const db = await getDB()
    await db.put(STORE, state, STATE_KEY)
  } catch (err) {
    // Persistenzfehler dürfen die UI nicht crashen lassen.
    console.error('Speichern des Nutzerzustands fehlgeschlagen:', err)
  }
}

// --- Katalog (importierte Mounts) ---

/** Lädt den persistierten Katalog. `null` = noch kein Import → Default nutzen. */
export async function loadCatalog(): Promise<Mount[] | null> {
  try {
    const db = await getDB()
    const mounts = (await db.get(CATALOG, CATALOG_KEY)) as Mount[] | undefined
    return mounts ?? null
  } catch {
    return null
  }
}

export async function loadCatalogMeta(): Promise<CatalogMeta | null> {
  try {
    const db = await getDB()
    return ((await db.get(CATALOG, CATALOG_META_KEY)) as CatalogMeta) ?? null
  } catch {
    return null
  }
}

export async function saveCatalog(mounts: Mount[], meta: CatalogMeta): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(CATALOG, 'readwrite')
  await tx.store.put(mounts, CATALOG_KEY)
  await tx.store.put(meta, CATALOG_META_KEY)
  await tx.done
}

export async function clearCatalog(): Promise<void> {
  const db = await getDB()
  await db.clear(CATALOG)
}
