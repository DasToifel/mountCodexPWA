/** Schlichter Lade-Spinner im Markendesign (Gold). */
export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-elevated border-t-gold"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Lädt"
    />
  )
}
