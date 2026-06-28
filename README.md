# MountCodex – PWA

Progressive Web App zum World-of-Warcraft-Addon **MountCodex**. Sammle alle
Reittiere, plane Farmrouten und verfolge deinen Fortschritt – installierbar auf
iPhone & Android, **voll offlinefähig**, mit App-Feeling (Dark Mode, untere Tab
Bar, sanfte Animationen, Glassmorphism).

> Stack: **React 19 · TypeScript · Vite 6 · Tailwind v4 · vite-plugin-pwa ·
> IndexedDB · React Router · Framer Motion**

---

## Schnellstart

```bash
npm install      # Abhängigkeiten
npm run dev      # Dev-Server (http://localhost:5173)
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal testen
npm run icons    # PWA-Icons aus SVG neu erzeugen (public/icons/)
```

Nach dem Klonen funktionieren `install` / `dev` / `build` ohne weitere Schritte.

---

## Architektur

```
UI (pages/components)
        │  liest/mutiert über Hook
        ▼
AppContext  ──────────────► state/AppContext.tsx  (Source of Truth)
        │                         │
        │ Katalog                 │ Nutzerzustand
        ▼                         ▼
services/dataSource.ts       services/db.ts (IndexedDB)
   (DataSource-Interface)
   ├─ LocalDataSource  ← heute (gebündelte Daten)
   └─ AddonSyncDataSource ← Zukunft (Addon-Export), gleiches Interface
```

- **Katalog vs. Nutzerzustand getrennt.** `Mount` (statisch) kommt aus `DataSource`;
  Favoriten/gesammelt/Notizen/Verlauf liegen separat in IndexedDB (anhand der Mount-ID).
- **DataSource-Interface** = Andockpunkt für den späteren **Addon-Sync**: neue Quelle
  implementieren, fertig – kein UI-Code ändert sich.
- **Import/Export-Format** (`ExportBundle`) ist versioniert und zugleich das künftige
  Sync-Format.
- **IndexedDB statt LocalStorage** für den Nutzerzustand: asynchron, größer, sync-tauglich.
  Einfache Settings (Name/Sprache/Theme) liegen in LocalStorage.

### Ordnerstruktur

```
src/
├── components/
│   ├── layout/   AppLayout (Outlet + Tab Bar + Seitenübergänge)
│   ├── ui/       Card, ProgressRing, ProgressBar, Chip, SearchBar,
│   │             StatTile, SectionHeader, EmptyState, TabBar
│   └── mount/    MountCard, MountRow, MountImage, RarityBadge, FilterSheet
├── pages/        Dashboard, Mounts, MountDetail, FarmRoutes,
│                 FarmRouteDetail, Collection, Settings
├── state/        AppContext (zentraler Store)
├── services/     dataSource (Interface + Impl.), db (IndexedDB)
├── lib/          stats, search/filter, format
├── hooks/        useLocalStorage
├── data/         mounts, farmRoutes (Beispieldaten)
├── types/        mount, farmRoute, userState
├── index.css     Designsystem (Tailwind v4 @theme: Farben/Radien)
└── main.tsx / App.tsx
```

---

## Funktionen

- **Dashboard** – Gesamtfortschritt (Ring), Stats, Mount des Tages, Favoriten,
  zuletzt angesehen, Schnellzugriffe.
- **Mounts** – Live-Suche, Sortierung, Filter (Erweiterung, Quelle, Seltenheit,
  Sammelstatus, Favoriten) im Bottom-Sheet.
- **Detail** – Großbild, alle Felder (Boss/Dungeon/Raid/Zone/Kontinent/Patch/
  Dropchance/Voraussetzungen/Händler/Beruf/Event/Koordinaten), Erfolge, Routen,
  Favorit & Sammelstatus, persönliche Notiz.
- **Farmrouten** – Karte mit nummerierten Wegpunkten, Empfehlung, Respawn, Hinweise.
- **Sammlung** – Gesamt-%, Aufschlüsselung nach Erweiterung & Quelle mit Balken.
- **Einstellungen** – Dark/Light, Sprache, Import/Export (JSON), Reset, Sync-Platzhalter.

---

## Deployment auf GitHub Pages

1. Repo auf GitHub anlegen mit Namen **`MountCodexPWA`** (muss zu `base` in
   `vite.config.ts` passen: `/MountCodexPWA/`). Anderer Name → `base` dort anpassen.
2. Push auf `main`.
3. **Settings ▸ Pages ▸ Source = „GitHub Actions“** wählen.
4. Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht automatisch.
   Ergebnis: `https://<user>.github.io/MountCodexPWA/`.

PWA-Hinweise: Es wird **HashRouter** verwendet → keine 404 bei Reload/Deep-Links
auf Pages. Der Service Worker (`vite-plugin-pwa`, `autoUpdate`) cached alle Assets
für Offline-Betrieb.

### Auf dem iPhone installieren
Safari ▸ Teilen ▸ „Zum Home-Bildschirm“. Startet dann im Vollbild wie eine App.

---

## Daten & Import-System

**Keine Daten im Code.** Der Katalog wird zur Laufzeit als JSON geladen und ist
über ein Import-System ersetzbar – ausgelegt auf **2000+ Mounts**.

Ladereihenfolge (in `state/AppContext.tsx`):
1. **Importierter Katalog** aus IndexedDB (hat Vorrang).
2. Sonst gebündelte **`public/data/mounts.json`** über die `DataSource`.

Alle Quellen laufen durch dieselbe Pipeline `services/mountImport.ts`
(`parseMountFile`): Validierung, Normalisierung, Defaults, Deduplizierung nach
`id`. Damit ist späterer **automatischer Import** (externe Quelle oder
MountCodex-Addon-Export) nur eine neue `DataSource`-Implementierung
(`RemoteDataSource` liegt bereits bei).

### Dateiformat (`mountcodex/mounts`)

```jsonc
{
  "schema": "mountcodex/mounts",
  "version": 1,
  "source": "addon-export",      // optional
  "mounts": [
    {
      "id": 31821,                // Pflicht (WoW-Mount-ID)
      "name": "Aschenbringer",    // Pflicht
      "rarity": "legendary",      // common|uncommon|rare|epic|legendary
      "expansion": "Wrath of the Lich King",
      "patch": "3.3.5",
      "faction": "neutral",       // alliance|horde|neutral
      "flying": true, "ground": false, "aquatic": false,
      "special": ["limitiert"],
      "description": "…",
      "sources": [
        { "type": "drop", "boss": "Halion", "raid": "…", "zone": "…",
          "continent": "…", "dropChance": 0.01,
          "coordinates": { "zone": "…", "x": 56, "y": 58 } }
      ],
      "achievements": [], "notes": "…", "tags": ["drache"]
    }
  ]
}
```

Fehlende Felder sind erlaubt – die Pipeline ergänzt sinnvolle Defaults und meldet
Warnungen. **Import per UI:** Einstellungen ▸ Mount-Datenbank ▸ importieren.

> Sammelstatus, Favorit und persönliche Notizen sind **pro Nutzer** und liegen
> bewusst getrennt im Nutzerzustand (IndexedDB), nicht im Katalog-JSON.

## Performance

- **Virtualisierung** der Mount-Liste (`@tanstack/react-virtual`, Window-Modus) –
  nur sichtbare Zeilen im DOM, flüssig bei tausenden Einträgen.
- **Vorberechneter Suchindex** (`buildSearchEntries`) → Live-Suche scannt fertige
  Strings statt sie pro Tastendruck neu zu bauen.
- **Code-Splitting**: jede Seite ein eigener Lazy-Chunk (`React.lazy`).
- **Memoisierung** aller abgeleiteten Listen/Sets im `AppContext`.
- **Lazy Images** + prozedurale Platzhalter, bis echte Bilder vorliegen.
