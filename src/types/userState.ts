/**
 * Nutzerzustand – getrennt vom statischen Katalog, in IndexedDB persistiert.
 * Dieses Format ist zugleich das Import/Export- und (später) Sync-Format.
 */

export interface UserState {
  /** IDs gesammelter Mounts. */
  collected: number[]
  /** IDs favorisierter Mounts. */
  favorites: number[]
  /** Persönliche Notizen je Mount-ID. */
  notes: Record<number, string>
  /** Zuletzt angesehene Mount-IDs (jüngstes zuerst). */
  recent: number[]
}

export const EMPTY_USER_STATE: UserState = {
  collected: [],
  favorites: [],
  notes: {},
  recent: [],
}

/** Versioniertes Export-Format (vorbereitet für Addon-Sync). */
export interface ExportBundle {
  app: 'MountCodex'
  version: 1
  exportedAt: string // ISO-Datum
  state: UserState
}
