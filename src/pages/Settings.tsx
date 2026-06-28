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
            className="w-40 rounded-lg bg-elevated px-2 py-1 text-right text-ink outline-none"
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
            className="rounded-lg bg-elevated px-2 py-1 text-ink outline-none"
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </Row>
      </Group>

      {/* Daten */}
      <Group title="Daten">
        <button onClick={handleExport} className="w-full p-3 text-left text-[15px] text-ink active:bg-elevated">
          ⬆️ Sammlung exportieren
        </button>
        <Divider />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full p-3 text-left text-[15px] text-ink active:bg-elevated"
        >
          ⬇️ Sammlung importieren
        </button>
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
        <button
          onClick={() => {
            if (confirm('Wirklich alle Sammeldaten zurücksetzen?')) {
              resetState()
              flash('Zurückgesetzt.')
            }
          }}
          className="w-full p-3 text-left text-[15px] text-danger active:bg-elevated"
        >
          🗑️ Sammlung zurücksetzen
        </button>
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
        <button
          onClick={() => catalogFileRef.current?.click()}
          className="w-full p-3 text-left text-[15px] text-ink active:bg-elevated"
        >
          📥 Mount-Datenbank importieren (JSON)
        </button>
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
        <button
          onClick={() => {
            if (confirm('Importierten Katalog verwerfen und Standarddaten laden?')) {
              void resetCatalog().then(() => flash('Katalog zurückgesetzt.'))
            }
          }}
          className="w-full p-3 text-left text-[15px] text-danger active:bg-elevated"
        >
          ♻️ Auf Standarddaten zurücksetzen
        </button>
        <p className="px-3 pb-3 text-[13px] text-ink-3">
          Erwartet eine JSON-Datei im Format <code>mountcodex/mounts</code>. Skaliert auf
          tausende Mounts. Spätere Quelle: MountCodex-Addon-Export.
        </p>
      </Group>

      {/* Synchronisation (Vorbereitung) */}
      <Group title="Synchronisation">
        <Row label="Mit MountCodex-Addon">
          <span className="text-[13px] text-ink-3">Bald</span>
        </Row>
        <p className="px-3 pb-3 text-[13px] text-ink-3">
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3">
      <span className="text-[15px] text-ink">{label}</span>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-separator" />
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className={`relative h-7 w-12 rounded-full transition-colors ${on ? 'bg-gold' : 'bg-separator'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
