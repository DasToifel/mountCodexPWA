/**
 * Haptik-Vorbereitung. Nutzt die Vibration-API (Android/Chrome). iOS-Safari
 * unterstützt sie (noch) nicht – Aufrufe sind dort einfach No-Ops. Die App ist
 * damit „haptik-ready“: zentrale Stelle, später leicht durch eine native
 * Bridge (z. B. Capacitor Haptics) ersetzbar.
 */
type HapticKind = 'light' | 'medium' | 'success' | 'warning'

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 18,
  success: [10, 40, 10],
  warning: [20, 60, 20],
}

export function haptic(kind: HapticKind = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(PATTERNS[kind])
    } catch {
      /* nicht unterstützt – ignorieren */
    }
  }
}
