import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import {
  EXPANSION_SHORT,
  FACTION_LABEL,
  SOURCE_LABEL,
  type MountSource,
} from '@/types/mount'
import { formatChance } from '@/lib/format'
import { haptic } from '@/lib/haptics'
import { MountImage } from '@/components/mount/MountImage'
import { RarityBadge } from '@/components/mount/RarityBadge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export function MountDetail() {
  const { id } = useParams()
  const mountId = Number(id)
  const navigate = useNavigate()
  const {
    mountById,
    farmRoutes,
    collectedSet,
    favoritesSet,
    userState,
    toggleCollected,
    toggleFavorite,
    setNote,
    markRecent,
  } = useApp()

  const mount = mountById.get(mountId)

  // In den Verlauf aufnehmen (Dashboard „Zuletzt angesehen“).
  useEffect(() => {
    if (mount) markRecent(mountId)
  }, [mountId, mount, markRecent])

  if (!mount) {
    return (
      <EmptyState
        title="Mount nicht gefunden"
        actionLabel="Zurück"
        onAction={() => navigate(-1)}
      />
    )
  }

  const collected = collectedSet.has(mount.id)
  const favorite = favoritesSet.has(mount.id)
  const routes = farmRoutes.filter((r) => r.mountId === mount.id)
  const note = userState.notes[mount.id] ?? ''

  return (
    <div className="-mx-4 space-y-5">
      {/* Heldenbild */}
      <div className="relative">
        <MountImage
          src={mount.image}
          icon={mount.icon}
          iconFileId={mount.iconFileId}
          alt={mount.name}
          rarity={mount.rarity}
          seed={mount.id}
          rounded="rounded-none"
          className="h-64 w-full"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="glass absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full text-ink"
          aria-label="Zurück"
        >
          ‹
        </button>
        <div className="absolute right-4 top-4 flex gap-2">
          <IconToggle
            active={favorite}
            onClick={() => {
              haptic('light')
              toggleFavorite(mount.id)
            }}
            label="Favorit"
          >
            ★
          </IconToggle>
          <IconToggle
            active={collected}
            onClick={() => {
              haptic('success')
              toggleCollected(mount.id)
            }}
            label="Gesammelt"
            activeClass="text-success"
          >
            ✓
          </IconToggle>
        </div>
      </div>

      <div className="space-y-5 px-4">
        {/* Titel + Meta */}
        <div>
          <h1 className="text-2xl font-bold text-ink">{mount.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RarityBadge rarity={mount.rarity} />
            <MetaPill>{EXPANSION_SHORT[mount.expansion]}</MetaPill>
            {mount.patch && <MetaPill>Patch {mount.patch}</MetaPill>}
            {mount.spellId != null && <MetaPill>Spell {mount.spellId}</MetaPill>}
            <MetaPill>{FACTION_LABEL[mount.faction]}</MetaPill>
          </div>
        </div>

        {mount.description && (
          <p className="text-[15px] leading-relaxed text-ink-2">{mount.description}</p>
        )}

        {/* Eigenschaften: Bewegungsart + Besonderheiten */}
        {(mount.flying || mount.ground || mount.aquatic || mount.special.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {mount.flying && <PropPill icon="🪽" label="Flugfähig" />}
            {mount.ground && <PropPill icon="🐾" label="Boden" />}
            {mount.aquatic && <PropPill icon="🌊" label="Wasser" />}
            {mount.special.map((s) => (
              <PropPill key={s} icon="✦" label={s} />
            ))}
          </div>
        )}

        {/* Quellen */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">
            {mount.sources.length > 1 ? 'Quellen' : 'Quelle'}
          </h2>
          {mount.sources.map((s, i) => (
            <SourceCard key={i} source={s} />
          ))}
        </section>

        {/* Erfolge */}
        {mount.achievements.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-ink">Erfolge</h2>
            {mount.achievements.map((a) => (
              <Card key={a} className="p-3 text-[15px] text-ink">
                🏅 {a}
              </Card>
            ))}
          </section>
        )}

        {/* Farmrouten */}
        {routes.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-ink">Farmrouten</h2>
            {routes.map((r) => (
              <Link key={r.id} to={`/routes/${r.id}`}>
                <Card className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-semibold text-ink">{r.title}</div>
                    <div className="text-[13px] text-ink-2">{r.zone}</div>
                  </div>
                  <span className="text-ink-3">›</span>
                </Card>
              </Link>
            ))}
          </section>
        )}

        {/* Redaktioneller Hinweis */}
        {mount.notes && (
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-ink">Hinweise</h2>
            <Card className="p-3 text-[15px] text-ink-2">{mount.notes}</Card>
          </section>
        )}

        {/* Persönliche Notiz */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-ink">Persönliche Notiz</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(mount.id, e.target.value)}
            placeholder="Eigene Notizen zu diesem Mount…"
            rows={4}
            className="w-full resize-none rounded-card border border-separator bg-surface p-3 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-gold/50"
          />
        </section>
      </div>
    </div>
  )
}

function SourceCard({ source }: { source: MountSource }) {
  const rows: [string, string | undefined][] = [
    ['Boss', source.boss],
    ['Dungeon', source.dungeon],
    ['Schlachtzug', source.raid],
    ['Instanz', source.instance],
    ['Zone', source.zone],
    ['Kontinent', source.continent],
    ['Händler', source.vendor],
    ['Kosten', source.cost],
    ['Beruf', source.profession],
    ['Event', source.event],
    ['Erfolg', source.achievement],
    ['Voraussetzung', source.requirement],
    ['Fraktion', source.faction ? FACTION_LABEL[source.faction] : undefined],
    ['Dropchance', source.dropChance != null ? formatChance(source.dropChance) : undefined],
    [
      'Koordinaten',
      source.coordinates
        ? `${source.coordinates.zone} (${source.coordinates.x}, ${source.coordinates.y})`
        : undefined,
    ],
  ]

  return (
    <Card className="p-4">
      <div className="mb-2 font-semibold text-gold">{SOURCE_LABEL[source.type]}</div>
      <dl className="space-y-1.5">
        {rows
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label} className="flex gap-3 text-[14px]">
              <dt className="w-28 shrink-0 text-ink-3">{label}</dt>
              <dd className="text-ink">{value}</dd>
            </div>
          ))}
      </dl>
    </Card>
  )
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-ink-2">
      {children}
    </span>
  )
}

function PropPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-separator bg-surface px-2.5 py-1 text-[13px] capitalize text-ink">
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  )
}

function IconToggle({
  active,
  onClick,
  label,
  activeClass = 'text-gold',
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  activeClass?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`glass grid h-9 w-9 place-items-center rounded-full text-lg ${
        active ? activeClass : 'text-ink-3'
      }`}
    >
      {children}
    </button>
  )
}
