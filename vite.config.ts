import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Repo-Name → Pages-URL = <user>.github.io/mountCodexPWA/
// `base` MUSS mit dem Repo-Namen übereinstimmen, sonst lädt nichts nach Deploy.
const REPO_BASE = '/mountCodexPWA/'

// https://vite.dev/config/
export default defineConfig({
  base: REPO_BASE,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Service Worker auch im `vite dev` testbar.
      devOptions: { enabled: true },
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'MountCodex',
        short_name: 'MountCodex',
        description: 'Dein Begleiter zum Sammeln aller WoW-Reittiere.',
        lang: 'de',
        // Wichtig: relativ zu `base`, damit Pages-Subpfad korrekt ist.
        scope: REPO_BASE,
        start_url: REPO_BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E1116',
        theme_color: '#0E1116',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Alle Build-Assets vorab cachen → voll offlinefähig.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: `${REPO_BASE}index.html`,
      },
    }),
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
