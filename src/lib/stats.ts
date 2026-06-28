/** Berechnung der Sammelstatistik. Reine Funktionen → leicht testbar. */
import type { Expansion, Mount, SourceType } from '@/types/mount'

export interface Breakdown {
  collected: number
  total: number
}

export interface CollectionStats {
  total: number
  collected: number
  missing: number
  progress: number // 0..1
  byExpansion: Partial<Record<Expansion, Breakdown>>
  bySource: Partial<Record<SourceType, Breakdown>>
}

export function computeStats(
  mounts: Mount[],
  collected: Set<number>,
): CollectionStats {
  const total = mounts.length
  let collectedCount = 0
  const byExpansion: Partial<Record<Expansion, Breakdown>> = {}
  const bySource: Partial<Record<SourceType, Breakdown>> = {}

  for (const mount of mounts) {
    const isCollected = collected.has(mount.id)
    if (isCollected) collectedCount++

    const exp = (byExpansion[mount.expansion] ??= { collected: 0, total: 0 })
    exp.total++
    if (isCollected) exp.collected++

    const type = mount.sources[0]?.type
    if (type) {
      const src = (bySource[type] ??= { collected: 0, total: 0 })
      src.total++
      if (isCollected) src.collected++
    }
  }

  return {
    total,
    collected: collectedCount,
    missing: Math.max(total - collectedCount, 0),
    progress: total > 0 ? collectedCount / total : 0,
    byExpansion,
    bySource,
  }
}

/** Deterministisches „Mount des Tages“ (gleicher Tag → gleiches Mount). */
export function mountOfTheDay(mounts: Mount[], date = new Date()): Mount | undefined {
  if (mounts.length === 0) return undefined
  const dayIndex = Math.floor(date.getTime() / 86_400_000)
  return mounts[dayIndex % mounts.length]
}
