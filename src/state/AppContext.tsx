/**
 * Zentraler App-Store (Source of Truth).
 *
 * Vereint statischen Katalog (DataSource) mit dem Nutzerzustand (IndexedDB).
 * Stellt abgeleitete Sets (collected/favorites) und alle Mutationen bereit.
 * Eine Stelle → konsistente Daten, dünne Komponenten.
 *
 * Bewusst Context + Hooks statt externer State-Lib: passt zur Größe der App,
 * keine Zusatzabhängigkeit, klare Datenflüsse.
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
import { loadUserState, saveUserState } from '@/services/db'

const RECENT_MAX = 12

interface AppContextValue {
  loading: boolean
  mounts: Mount[]
  mountById: Map<number, Mount>
  farmRoutes: FarmRoute[]
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
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [mounts, setMounts] = useState<Mount[]>([])
  const [farmRoutes, setFarmRoutes] = useState<FarmRoute[]>([])
  const [userState, setUserState] = useState<UserState>(EMPTY_USER_STATE)

  // Verhindert das Überschreiben der DB mit dem leeren Default vor dem Laden.
  const hydrated = useRef(false)

  // Initiales Laden: Katalog + persistierter Nutzerzustand.
  useEffect(() => {
    let active = true
    void (async () => {
      const [m, r, s] = await Promise.all([
        dataSource.getMounts(),
        dataSource.getFarmRoutes(),
        loadUserState(),
      ])
      if (!active) return
      setMounts([...m].sort((a, b) => a.name.localeCompare(b.name)))
      setFarmRoutes(r)
      setUserState(s)
      hydrated.current = true
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  // Persistenz: jede Änderung des Nutzerzustands speichern (nach Hydration).
  useEffect(() => {
    if (hydrated.current) void saveUserState(userState)
  }, [userState])

  const mountById = useMemo(
    () => new Map(mounts.map((m) => [m.id, m])),
    [mounts],
  )
  const collectedSet = useMemo(
    () => new Set(userState.collected),
    [userState.collected],
  )
  const favoritesSet = useMemo(
    () => new Set(userState.favorites),
    [userState.favorites],
  )

  // --- Mutationen (immutabel, damit React zuverlässig neu rendert) ---

  const toggleCollected = useCallback((id: number) => {
    setUserState((s) => {
      const has = s.collected.includes(id)
      return {
        ...s,
        collected: has
          ? s.collected.filter((x) => x !== id)
          : [...s.collected, id],
      }
    })
  }, [])

  const toggleFavorite = useCallback((id: number) => {
    setUserState((s) => {
      const has = s.favorites.includes(id)
      return {
        ...s,
        favorites: has
          ? s.favorites.filter((x) => x !== id)
          : [...s.favorites, id],
      }
    })
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
    setUserState((s) => {
      const recent = [id, ...s.recent.filter((x) => x !== id)].slice(0, RECENT_MAX)
      return { ...s, recent }
    })
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
    // Defensiv mergen, damit unvollständige Importe nicht crashen.
    setUserState({ ...EMPTY_USER_STATE, ...bundle.state })
  }, [])

  const resetState = useCallback(() => setUserState(EMPTY_USER_STATE), [])

  const value: AppContextValue = {
    loading,
    mounts,
    mountById,
    farmRoutes,
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
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp muss innerhalb von <AppProvider> genutzt werden.')
  return ctx
}
