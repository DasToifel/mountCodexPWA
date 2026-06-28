import { AnimatePresence, motion } from 'framer-motion'
import {
  EXPANSIONS,
  EXPANSION_SHORT,
  RARITIES,
  RARITY_LABEL,
  SOURCE_LABEL,
  type Expansion,
  type Rarity,
  type SourceType,
} from '@/types/mount'
import type { MountFilters } from '@/lib/search'
import { Chip } from '@/components/ui/Chip'

interface Props {
  open: boolean
  filters: MountFilters
  onChange: (f: MountFilters) => void
  onReset: () => void
  onClose: () => void
}

const ALL_SOURCES = Object.keys(SOURCE_LABEL) as SourceType[]

/** Bottom-Sheet für Detailfilter (Erweiterung, Quelle, Seltenheit). */
export function FilterSheet({ open, filters, onChange, onReset, onClose }: Props) {
  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    return next
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="glass fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-[1.5rem] border-t border-separator p-5"
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-separator" />
            <div className="mb-4 flex items-center justify-between">
              <button onClick={onReset} className="text-[13px] font-medium text-danger">
                Zurücksetzen
              </button>
              <h2 className="font-bold text-ink">Filter</h2>
              <button onClick={onClose} className="text-[13px] font-semibold text-gold">
                Fertig
              </button>
            </div>

            <Group title="Seltenheit">
              {RARITIES.map((r: Rarity) => (
                <Chip
                  key={r}
                  label={RARITY_LABEL[r]}
                  active={filters.rarities.has(r)}
                  onClick={() => onChange({ ...filters, rarities: toggle(filters.rarities, r) })}
                />
              ))}
            </Group>

            <Group title="Erweiterung">
              {EXPANSIONS.map((e: Expansion) => (
                <Chip
                  key={e}
                  label={EXPANSION_SHORT[e]}
                  active={filters.expansions.has(e)}
                  onClick={() => onChange({ ...filters, expansions: toggle(filters.expansions, e) })}
                />
              ))}
            </Group>

            <Group title="Quelle">
              {ALL_SOURCES.map((s) => (
                <Chip
                  key={s}
                  label={SOURCE_LABEL[s]}
                  active={filters.sources.has(s)}
                  onClick={() => onChange({ ...filters, sources: toggle(filters.sources, s) })}
                />
              ))}
            </Group>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 font-semibold text-ink">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
