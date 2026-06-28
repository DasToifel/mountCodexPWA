import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { ExportBundle } from '@/types/userState'
import { Card } from '@/components/ui/Card'

type Theme = 'dark' | 'light'

export function Settings() {
  const {
    mounts,
    catalogMeta,
    exportState,
    importState,
    resetState,
    importMounts,
    resetCatalog,
  } = useApp()
  const [name, setName] = useLocalStorage('mc.name', 'Abenteurer')
  const [language, setLanguage] = useLocalStorage('mc.language', 'de')
  const [theme, setTheme] = useLocalStorage<Theme>('mc.theme', 'dark')
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const catalogFileRef = useRef<HTMLInputElement>(null)

  // Theme auf <html> anwenden (Standard: dark).
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', theme === 'dark')
    el.classList.toggle('light', theme === 'light')
  }, [theme])

  const flash = (msg: string) => {
    setMessage(msg)
    window.setTimeout(() => setMessage(null), 2500)
  }

  const handleExport = () => {
    const bundle = exportState()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mountcodex-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('Export gespeichert.')
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const bundle = JSON.parse(text) as ExportBundle
      if (bundle.app !== 'MountCodex' || !bundle.state) {
        throw new Error('Ungültige Datei')
      }
      importState(bundle)
      flash('Import erfolgreich.')
    } catch {
      flash('Import fehlgeschlagen – ungültige Datei.')
    }
  }

  const handleCatalogImport = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text())
      const summary = await importMounts(raw)
      flash(
        `${summary.imported} Mounts importiert` +
          (summary.warnings.length ? ` (${summary.warnings.length} Warnungen)` : '') +
          '.',
      )
    } catch (e) {
      flash(e instanceof Error ? `Import fehlgeschlagen: ${e.message}` : 'Import fehlgeschlagen.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="pt-2 text-2xl font-bold text-ink">Einstellungen</h1>

      {message && (
        <div className="rounded-card bg-gold/15 p-3 text-[14px] text-ink">{message}</div>
      )}

      {/* Profil */}
      <Group title="Profil">
        <Row label="Anzeigename">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${FIELD} w-44 max-w-full text-right`}
          />
        </Row>
      </Group>

      {/* Darstellung */}
      <Group title="Darstellung">
        <Row label="Dark Mode">
          <Switch
            on={theme === 'dark'}
            onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        </Row>
        <Row label="Sprache">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={FIELD}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </Row>
      </Group>

      {/* Daten */}
      <Group title="Daten">
        <RowButton onClick={handleExport}>⬆️ Sammlung exportieren</RowButton>
        <Divider />
        <RowButton onClick={() => fileRef.current?.click()}>
          ⬇️ Sammlung importieren
        </RowButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleImport(f)
            e.target.value = ''
          }}
        />
        <Divider />
        <RowButton
          tone="text-danger"
          onClick={() => {
            if (confirm('Wirklich alle Sammeldaten zurücksetzen?')) {
              resetState()
              flash('Zurückgesetzt.')
            }
          }}
        >
          🗑️ Sammlung zurücksetzen
        </RowButton>
      </Group>

      {/* Mount-Datenbank (Katalog-Import) */}
      <Group title="Mount-Datenbank">
        <Row label="Mounts geladen">
          <span className="text-ink-2">{mounts.length}</span>
        </Row>
        <Divider />
        <Row label="Quelle">
          <span className="text-[13px] text-ink-3">{catalogMeta?.source ?? '—'}</span>
        </Row>
        <Divider />
        <RowButton onClick={() => catalogFileRef.current?.click()}>
          📥 Mount-Datenbank importieren (JSON)
        </RowButton>
        <input
          ref={catalogFileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleCatalogImport(f)
            e.target.value = ''
          }}
        />
        <Divider />
        <RowButton
          tone="text-danger"
          onClick={() => {
            if (confirm('Importierten Katalog verwerfen und Standarddaten laden?')) {
              void resetCatalog().then(() => flash('Katalog zurückgesetzt.'))
            }
          }}
        >
          ♻️ Auf Standarddaten zurücksetzen
        </RowButton>
        <p className="px-4 pb-3 pt-1 text-[13px] text-ink-3">
          Erwartet eine JSON-Datei im Format <code>mountcodex/mounts</code>. Skaliert auf
          tausende Mounts. Spätere Quelle: MountCodex-Addon-Export.
        </p>
      </Group>

      {/* Synchronisation (Vorbereitung) */}
      <Group title="Synchronisation">
        <Row label="Mit MountCodex-Addon">
          <span className="text-[13px] text-ink-3">Bald</span>
        </Row>
        <p className="px-4 pb-3 pt-1 text-[13px] text-ink-3">
          Künftig kannst du den Addon-Export direkt importieren. Das Import/Export-Format
          ist bereits darauf vorbereitet.
        </p>
      </Group>

      {/* Über */}
      <Group title="Über">
        <Row label="Version">
          <span className="text-ink-2">1.0.0</span>
        </Row>
        <Row label="Mounts in Datenbank">
          <span className="text-ink-2">{mounts.length}</span>
        </Row>
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">
        {title}
      </h2>
      <Card className="overflow-hidden">{children}</Card>
    </section>
  )
}

/**
 * Einheitliche Höhe + Innenabstände für alle Eingabeelemente (iOS-Look).
 * Genau EINE Stelle für Feldstyling → keine versetzten Controls.
 */
const FIELD =
  'h-9 rounded-lg bg-elevated px-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-gold/40'

/** Standard-Zeile: feste Mindesthöhe (44pt-Touchziel +), zentriert. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-4 px-4">
      <span className="min-w-0 truncate text-[15px] text-ink">{label}</span>
      <div className="flex min-w-0 items-center justify-end">{children}</div>
    </div>
  )
}

/** Tippbare Zeile (wie Row, aber als Button) – identische Höhe/Abstände. */
function RowButton({
  onClick,
  children,
  tone = 'text-ink',
}: {
  onClick: () => void
  children: React.ReactNode
  tone?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-[15px] active:bg-elevated ${tone}`}
    >
      {children}
    </button>
  )
}

/** Trennlinie mit iOS-typischem Einzug (bündig zum Zeilentext). */
function Divider() {
  return <div className="ml-4 h-px bg-separator" />
}

/**
 * iOS-Switch ohne Absolutpositionierung: Track = inline-flex mit Padding,
 * Thumb gleitet per translate. Geometrie: Track 44×24, Padding 2, Thumb 20 →
 * Weg = 44−2·2−20 = 20px (= translate-x-5). Sitzt dadurch immer bündig in der
 * Card und ist vertikal automatisch zentriert (kein Überlaufen, kein Hack).
 */
function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        on ? 'bg-gold' : 'bg-separator'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
