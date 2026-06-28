/**
 * Zentraler App-Store (Source of Truth).
 *
 * Vereint Katalog (per JSON geladen, in IndexedDB überschreibbar) mit dem
 * Nutzerzustand (IndexedDB). Stellt abgeleitete Sets, vorberechneten Suchindex
 * und alle Mutationen + Import/Export bereit. Eine Stelle → konsistente Daten,
 * dünne Komponenten.
 *
 * Ladestrategie Katalog:
 *   1. Persistierter Katalog in IndexedDB (z. B. nach Import) → hat Vorrang.
 *   2. Sonst gebündelte JSON über die DataSource (public/data/mounts.json).
 * So stehen Daten nie fest im Code und lassen sich später durch den
 * MountCodex-Addon-Export ersetzen.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Mount } from '@/types/mount'
import type { FarmRoute } from '@/types/farmRoute'
import {
  EMPTY_USER_STATE,
  type ExportBundle,
  type UserState,
} from '@/types/userState'
import { dataSource } from '@/services/dataSource'
import { parseMountFile } from '@/services/mountImport'
import {
  clearCatalog,
  loadCatalog,
  loadCatalogMeta,
  loadUserState,
  saveCatalog,
  saveUserState,
  type CatalogMeta,
} from '@/services/db'
import { buildSearchEntries, type SearchEntry } from '@/lib/search'

const RECENT_MAX = 12

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface ImportSummary {
  imported: number
  warnings: string[]
}

interface AppContextValue {
  status: LoadStatus
  error: string | null
  loading: boolean // Kurzform für status === 'loading'

  mounts: Mount[]
  mountById: Map<number, Mount>
  searchEntries: SearchEntry[]
  farmRoutes: FarmRoute[]
  catalogMeta: CatalogMeta | null

  userState: UserState
  collectedSet: Set<number>
  favoritesSet: Set<number>

  toggleCollected: (id: number) => void
  toggleFavorite: (id: number) => void
  setNote: (id: number, text: string) => void
  markRecent: (id: number) => void

  exportState: () => ExportBundle
  importState: (bundle: ExportBundle) => void
  resetState: () => void

  // Katalog-Verwaltung (Import-System)
  importMounts: (raw: unknown) => Promise<ImportSummary>
  resetCatalog: () => Promise<void>
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [mounts, setMounts] = useState<Mount[]>([])
  const [farmRoutes, setFarmRoutes] = useState<FarmRoute[]>([])
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta | null>(null)
  const [userState, setUserState] = useState<UserState>(EMPTY_USER_STATE)

  const hydrated = useRef(false)

  const applyMounts = useCallback((list: Mount[]) => {
    setMounts([...list].sort((a, b) => a.name.localeCompare(b.name)))
  }, [])

  const loadCatalogData = useCallback(async () => {
    // 1) persistierter Katalog?
    const persisted = await loadCatalog()
    if (persisted && persisted.length > 0) {
      applyMounts(persisted)
      setCatalogMeta(await loadCatalogMeta())
      return
    }
    // 2) gebündelte Default-Daten über die DataSource.
    const result = await dataSource.getMounts()
    applyMounts(result.mounts)
    setCatalogMeta({
      count: result.mounts.length,
      importedAt: new Date().toISOString(),
      source: result.meta.source ?? 'bundled',
    })
  }, [applyMounts])

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const [, routes, state] = await Promise.all([
        loadCatalogData(),
        dataSource.getFarmRoutes(),
        loadUserState(),
      ])
      setFarmRoutes(routes)
      setUserState(state)
      hydrated.current = true
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler beim Laden.')
      setStatus('error')
    }
  }, [loadCatalogData])

  useEffect(() => {
    void load()
  }, [load])

  // Persistenz Nutzerzustand (nach Hydration).
  useEffect(() => {
    if (hydrated.current) void saveUserState(userState)
  }, [userState])

  // --- Abgeleitetes ---
  const mountById = useMemo(
    () => new Map(mounts.map((m) => [m.id, m])),
    [mounts],
  )
  const searchEntries = useMemo(() => buildSearchEntries(mounts), [mounts])
  const collectedSet = useMemo(() => new Set(userState.collected), [userState.collected])
  const favoritesSet = useMemo(() => new Set(userState.favorites), [userState.favorites])

  // --- Nutzer-Mutationen ---
  const toggleCollected = useCallback((id: number) => {
    setUserState((s) => ({
      ...s,
      collected: s.collected.includes(id)
        ? s.collected.filter((x) => x !== id)
        : [...s.collected, id],
    }))
  }, [])

  const toggleFavorite = useCallback((id: number) => {
    setUserState((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    }))
  }, [])

  const setNote = useCallback((id: number, text: string) => {
    setUserState((s) => {
      const notes = { ...s.notes }
      const trimmed = text.trim()
      if (trimmed) notes[id] = trimmed
      else delete notes[id]
      return { ...s, notes }
    })
  }, [])

  const markRecent = useCallback((id: number) => {
    setUserState((s) => ({
      ...s,
      recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, RECENT_MAX),
    }))
  }, [])

  const exportState = useCallback(
    (): ExportBundle => ({
      app: 'MountCodex',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: userState,
    }),
    [userState],
  )

  const importState = useCallback((bundle: ExportBundle) => {
    setUserState({ ...EMPTY_USER_STATE, ...bundle.state })
  }, [])

  const resetState = useCallback(() => setUserState(EMPTY_USER_STATE), [])

  // --- Katalog-Verwaltung ---
  const importMounts = useCallback(
    async (raw: unknown): Promise<ImportSummary> => {
      const result = parseMountFile(raw)
      if (result.mounts.length === 0) {
        throw new Error(
          result.warnings[0] ?? 'Keine gültigen Mounts in der Datei gefunden.',
        )
      }
      const meta: CatalogMeta = {
        count: result.mounts.length,
        importedAt: new Date().toISOString(),
        source: result.meta.source ?? 'import',
      }
      await saveCatalog(result.mounts, meta)
      applyMounts(result.mounts)
      setCatalogMeta(meta)
      return { imported: result.mounts.length, warnings: result.warnings }
    },
    [applyMounts],
  )

  const resetCatalog = useCallback(async () => {
    await clearCatalog()
    await loadCatalogData()
  }, [loadCatalogData])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  const value: AppContextValue = {
    status,
    error,
    loading: status === 'loading',
    mounts,
    mountById,
    searchEntries,
    farmRoutes,
    catalogMeta,
    userState,
    collectedSet,
    favoritesSet,
    toggleCollected,
    toggleFavorite,
    setNote,
    markRecent,
    exportState,
    importState,
    resetState,
    importMounts,
    resetCatalog,
    refresh,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp muss innerhalb von <AppProvider> genutzt werden.')
  return ctx
}
