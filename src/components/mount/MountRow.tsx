import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Mount } from '@/types/mount'
import { SOURCE_LABEL } from '@/types/mount'
import { useApp } from '@/state/AppContext'
import { MountImage } from './MountImage'
import { RarityBadge } from './RarityBadge'

/** Listenzeile (Datenbank). Verlinkt auf die Detailseite. */
export function MountRow({ mount }: { mount: Mount }) {
  const { collectedSet, favoritesSet } = useApp()
  const collected = collectedSet.has(mount.id)
  const favorite = favoritesSet.has(mount.id)
  const source = mount.sources[0]

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        to={`/mounts/${mount.id}`}
        className="flex items-center gap-3 rounded-card border border-separator bg-surface p-3"
      >
        <MountImage
          src={mount.image}
          icon={mount.icon}
          iconFileId={mount.iconFileId}
          alt={mount.name}
          rarity={mount.rarity}
          seed={mount.id}
          className="h-14 w-14 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-ink">{mount.name}</div>
          <div className="mt-1 flex items-center gap-2">
            <RarityBadge rarity={mount.rarity} />
            {source && (
              <span className="truncate text-[13px] text-ink-2">
                {SOURCE_LABEL[source.type]}
                {source.boss ? ` · ${source.boss}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          {favorite && <span className="text-gold">★</span>}
          <span className={collected ? 'text-success' : 'text-ink-3'}>
            {collected ? '✓' : '○'}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
