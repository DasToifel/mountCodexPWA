import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export function FarmRoutes() {
  const { farmRoutes, mountById } = useApp()

  return (
    <div className="space-y-3">
      <h1 className="pt-2 text-2xl font-bold text-ink">Farmrouten</h1>

      {farmRoutes.length === 0 ? (
        <EmptyState
          title="Noch keine Farmrouten"
          message="Routen mit Wegpunkten und Respawn-Hinweisen erscheinen hier."
        />
      ) : (
        <div className="space-y-2">
          {farmRoutes.map((r) => {
            const mount = mountById.get(r.mountId)
            return (
              <Link key={r.id} to={`/routes/${r.id}`}>
                <Card className="flex items-center gap-3 p-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-elevated text-gold">
                    🗺️
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{r.title}</div>
                    <div className="text-[13px] text-ink-2">{r.zone}</div>
                    {mount && (
                      <div className="text-[12px] text-ink-3">für {mount.name}</div>
                    )}
                  </div>
                  {r.respawn && (
                    <span className="shrink-0 text-[12px] text-ink-3">⏱ {r.respawn}</span>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
