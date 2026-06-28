import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export function FarmRouteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { farmRoutes } = useApp()
  const route = farmRoutes.find((r) => r.id === Number(id))

  if (!route) {
    return <EmptyState title="Route nicht gefunden" actionLabel="Zurück" onAction={() => navigate(-1)} />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="text-2xl text-ink-2" aria-label="Zurück">
          ‹
        </button>
        <h1 className="text-2xl font-bold text-ink">{route.title}</h1>
      </div>

      {/* Karte mit Wegpunkten (normalisierte Koordinaten) */}
      <div className="relative aspect-video overflow-hidden rounded-card border border-separator bg-elevated">
        {route.mapImage ? (
          <img src={route.mapImage} alt={route.zone} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl text-ink-3">🗺️</div>
        )}
        {route.waypoints.map((wp, i) => (
          <div
            key={i}
            className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold text-[13px] font-bold text-black shadow-lg ring-1 ring-black/40"
            style={{ left: `${wp.x * 100}%`, top: `${wp.y * 100}%` }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {route.recommendation && (
        <div className="rounded-card bg-gold/10 p-4 text-[15px] text-ink">
          💡 {route.recommendation}
        </div>
      )}

      {route.respawn && (
        <p className="text-[15px] text-ink-2">⏱ Respawn: {route.respawn}</p>
      )}

      {route.tips.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-ink">Hinweise</h2>
          {route.tips.map((tip, i) => (
            <p key={i} className="text-[15px] text-ink">
              ✓ {tip}
            </p>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-ink">Wegpunkte</h2>
        {route.waypoints.map((wp, i) => (
          <Card key={i} className="flex items-start gap-3 p-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold text-[13px] font-bold text-black">
              {i + 1}
            </span>
            <div>
              <div className="font-semibold text-ink">{wp.title}</div>
              {wp.hint && <div className="text-[13px] text-ink-2">{wp.hint}</div>}
            </div>
          </Card>
        ))}
      </section>
    </div>
  )
}
