/** Kleine, reine Formatierungs-Helfer. */

/** Dropchance (0..1) als Prozent-String, fein bei sehr kleinen Werten. */
export function formatChance(chance: number): string {
  const pct = chance * 100
  return pct < 1 ? `${pct.toFixed(2)} %` : `${pct.toFixed(1)} %`
}

/** Prozentwert (0..1) als ganze Zahl. */
export function toPercent(ratio: number): number {
  return Math.round(ratio * 100)
}

/** Tageszeitabhängige Begrüßung. */
export function greeting(name: string, date = new Date()): string {
  const h = date.getHours()
  const part =
    h >= 5 && h < 11
      ? 'Guten Morgen'
      : h >= 11 && h < 17
        ? 'Hallo'
        : h >= 17 && h < 22
          ? 'Guten Abend'
          : 'Gute Nacht'
  return `${part}, ${name}`
}
