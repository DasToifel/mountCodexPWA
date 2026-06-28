import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Mount } from '@/types/mount'
import { useApp } from '@/state/AppContext'
import { MountImage } from './MountImage'
import { RarityBadge } from './RarityBadge'

/** Kompakte vertikale Karte für horizontale Karussells (Dashboard). */
export function MountCard({ mount, width = 132 }: { mount: Mount; width?: number }) {
  const { collectedSet } = useApp()
  const collected = collectedSet.has(mount.id)

  return (
    <motion.div whileTap={{ scale: 0.97 }} style={{ width }} className="shrink-0">
      <Link to={`/mounts/${mount.id}`} className="block">
        <div className="relative">
          <MountImage
            src={mount.image}
            alt={mount.name}
            rarity={mount.rarity}
            className="aspect-square w-full"
          />
          {collected && (
            <span className="glass absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-xs text-success">
              ✓
            </span>
          )}
        </div>
        <div className="mt-1.5 truncate text-[13px] text-ink">{mount.name}</div>
        <div className="mt-0.5">
          <RarityBadge rarity={mount.rarity} />
        </div>
      </Link>
    </motion.div>
  )
}
