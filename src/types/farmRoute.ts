/** Farmrouten-Typen (Bereich „Farmrouten“). */

export interface Waypoint {
  title: string
  hint?: string
  /** Normalisierte Kartenkoordinaten 0..1 (relativ zur Karte). */
  x: number
  y: number
}

export interface FarmRoute {
  id: number
  mountId: number
  title: string
  zone: string
  mapImage?: string
  waypoints: Waypoint[]
  tips: string[]
  respawn?: string
  recommendation?: string
}
