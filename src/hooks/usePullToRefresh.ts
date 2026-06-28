import { useEffect, useRef, useState } from 'react'
import { haptic } from '@/lib/haptics'

/**
 * Pull-to-Refresh für Touch-Geräte. Lauscht am Fenster und löst nur aus, wenn
 * ganz oben gescrollt ist und weit genug gezogen wurde. Liefert die aktuelle
 * Zugdistanz (für die Indikator-Animation) und den Refresh-Status.
 *
 * Bewusst entkoppelt von der Scroll-Mechanik der Seiten (keine geschachtelten
 * Scroll-Container) → robust und wiederverwendbar.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const distRef = useRef(0)
  const busy = useRef(false)
  const THRESHOLD = 64

  useEffect(() => {
    const reset = () => {
      setDistance(0)
      distRef.current = 0
    }

    const onStart = (e: TouchEvent) => {
      if (busy.current || window.scrollY > 0) return
      startY.current = e.touches[0].clientY
    }

    const onMove = (e: TouchEvent) => {
      if (startY.current == null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0 || window.scrollY > 0) {
        startY.current = null
        reset()
        return
      }
      // Dämpfung → „Gummiband“-Gefühl.
      const d = Math.min(dy * 0.5, 90)
      distRef.current = d
      setDistance(d)
    }

    const onEnd = async () => {
      if (startY.current == null) return
      startY.current = null
      if (distRef.current >= THRESHOLD) {
        busy.current = true
        setRefreshing(true)
        setDistance(THRESHOLD)
        haptic('success')
        try {
          await onRefresh()
        } finally {
          busy.current = false
          setRefreshing(false)
          reset()
        }
      } else {
        reset()
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [onRefresh])

  return { distance, refreshing, threshold: THRESHOLD }
}
