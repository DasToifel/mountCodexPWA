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

const DB_NAME = 'mountcodex'
const DB_VERSION = 1
const STORE = 'kv'
const STATE_KEY = 'userState'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE)
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
