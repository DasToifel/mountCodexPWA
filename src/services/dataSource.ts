/**
 * Abstraktion der Katalog-Datenquelle.
 *
 * Die App kennt nur dieses Interface – nicht, ob Daten lokal gebündelt sind,
 * von einem Server kommen oder (Zukunft) aus dem MountCodex-Addon-Export.
 * Neue Quelle = neue Implementierung, ohne UI-Änderung. Das ist der zentrale
 * Andockpunkt für den späteren Addon-Sync.
 */
import type { Mount } from '@/types/mount'
import type { FarmRoute } from '@/types/farmRoute'
import { MOUNTS } from '@/data/mounts'
import { FARM_ROUTES } from '@/data/farmRoutes'

export interface DataSource {
  getMounts(): Promise<Mount[]>
  getFarmRoutes(): Promise<FarmRoute[]>
}

/** Offline-Quelle: liefert die gebündelten Beispieldaten. */
export class LocalDataSource implements DataSource {
  async getMounts(): Promise<Mount[]> {
    return MOUNTS
  }
  async getFarmRoutes(): Promise<FarmRoute[]> {
    return FARM_ROUTES
  }
}

/**
 * Platzhalter für die Zukunft: lädt Mounts aus einem Addon-Export (JSON).
 * Heute noch nicht aktiv – zeigt aber, dass der Wechsel trivial ist.
 */
export class AddonSyncDataSource implements DataSource {
  constructor(private readonly fetchExport: () => Promise<Mount[]>) {}
  async getMounts(): Promise<Mount[]> {
    return this.fetchExport()
  }
  async getFarmRoutes(): Promise<FarmRoute[]> {
    return FARM_ROUTES
  }
}

/** Aktuell genutzte Quelle. Einziger Ort zum Umstellen. */
export const dataSource: DataSource = new LocalDataSource()
