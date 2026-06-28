import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TabBar } from '@/components/ui/TabBar'

/**
 * App-Rahmen: scrollbarer Inhalt mit sanftem Seitenübergang + fixe Tab Bar.
 * `pb` reserviert Platz für die Tab Bar inkl. Safe-Area.
 */
export function AppLayout() {
  const location = useLocation()

  return (
    <div className="mx-auto min-h-full max-w-xl">
      <main
        className="px-4"
        style={{
          paddingTop: 'calc(var(--safe-top) + 0.5rem)',
          paddingBottom: 'calc(var(--safe-bottom) + 5rem)',
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
