/**
 * Skeleton-Bausteine für Ladezustände. Dezenter Shimmer über Theme-Flächen.
 * Reduziert wahrgenommene Ladezeit gegenüber Spinnern.
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-card bg-elevated/80 ${className}`}
      aria-hidden
    />
  )
}

/** Platzhalterzeile passend zu MountRow. */
export function MountRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-card border border-separator bg-surface p-3">
      <Skeleton className="h-14 w-14 shrink-0 rounded-card" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
    </div>
  )
}

/** Liste aus Zeilen-Skeletons. */
export function MountListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <MountRowSkeleton key={i} />
      ))}
    </div>
  )
}
