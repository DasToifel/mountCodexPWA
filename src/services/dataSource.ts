/**
 * Abstraktion der Katalog-Datenquelle.
 *
 * Die App kennt nur dieses Interface – nicht, woher die Daten stammen.
 * Daten stehen NICHT im Code, sondern werden zur Laufzeit aus JSON geladen
 * (gebündelt unter public/data/, später per Import überschrieben oder vom
 * MountCodex-Addon-Export geliefert). Neue Quelle = neue Implementierung,
 * ohne UI-Änderung. Zentraler Andockpunkt für den späteren Sync.
 */
import type { MountFile } from '@/types/mount'
import type { FarmRoute } from '@/types/farmRoute'
import { parseMountFile, type ImportResult } from './mountImport'

export interface DataSource {
  getMounts(): Promise<ImportResult>
  getFarmRoutes(): Promise<FarmRoute[]>
}

/** Lädt JSON relativ zur App-Basis (GitHub-Pages-Subpfad-sicher). */
async function fetchJson<T>(file: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${file}`
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Konnte ${file} nicht laden (HTTP ${res.status}).`)
  return (await res.json()) as T
}

/**
 * Standard-Quelle: lädt die gebündelte JSON aus public/data/.
 * Läuft durch dieselbe Import-Pipeline wie ein manueller/Addon-Import →
 * konsistente Normalisierung, egal woher die Daten kommen.
 */
export class JsonDataSource implements DataSource {
  async getMounts(): Promise<ImportResult> {
    const data = await fetchJson<MountFile>('mounts.json')
    return parseMountFile(data)
  }

  async getFarmRoutes(): Promise<FarmRoute[]> {
    try {
      return await fetchJson<FarmRoute[]>('farmRoutes.json')
    } catch {
      return []
    }
  }
}

/**
 * Zukunft: Quelle, die einen Addon-/Remote-Export von einer URL zieht.
 * Bereits lauffähig – nur noch in `dataSource` eintragen, sobald verfügbar.
 */
export class RemoteDataSource implements DataSource {
  constructor(private readonly mountsUrl: string) {}
  async getMounts(): Promise<ImportResult> {
    const res = await fetch(this.mountsUrl, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`Remote-Import fehlgeschlagen (HTTP ${res.status}).`)
    return parseMountFile(await res.json())
  }
  async getFarmRoutes(): Promise<FarmRoute[]> {
    return []
  }
}

/** Aktiv genutzte Quelle. Einziger Ort zum Umstellen. */
export const dataSource: DataSource = new JsonDataSource()
