import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TabBar } from '@/components/ui/TabBar'
import { Spinner } from '@/components/ui/Spinner'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useApp } from '@/state/AppContext'

/**
 * App-Rahmen: scrollbarer Inhalt mit sanftem Seitenübergang, Pull-to-Refresh
 * und fixer Tab Bar. `pb` reserviert Platz für die Tab Bar inkl. Safe-Area.
 */
export function AppLayout() {
  const location = useLocation()
  const { refresh } = useApp()
  const { distance, refreshing, threshold } = usePullToRefresh(refresh)

  return (
    <div className="mx-auto min-h-full max-w-xl">
      {/* Pull-to-Refresh-Indikator */}
      <div
        className="pointer-events-none fixed inset-x-0 z-30 flex justify-center"
        style={{
          top: 'var(--safe-top)',
          height: distance,
          opacity: distance > 4 ? 1 : 0,
        }}
      >
        <div
          className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-elevated shadow-lg"
          style={{
            transform: `rotate(${(distance / threshold) * 180}deg)`,
            transition: refreshing ? 'none' : 'transform 0.1s linear',
          }}
        >
          {refreshing ? <Spinner size={18} /> : <span className="text-gold">↓</span>}
        </div>
      </div>

      <main
        className="px-4"
        style={{
          paddingTop: 'calc(var(--safe-top) + 0.5rem)',
          paddingBottom: 'calc(var(--safe-bottom) + 5rem)',
          transform: distance ? `translateY(${distance}px)` : undefined,
          transition: distance ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <TabBar />
    </div>
  )
}
