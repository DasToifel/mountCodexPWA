import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Mounts } from '@/pages/Mounts'
import { MountDetail } from '@/pages/MountDetail'
import { FarmRoutes } from '@/pages/FarmRoutes'
import { FarmRouteDetail } from '@/pages/FarmRouteDetail'
import { Collection } from '@/pages/Collection'
import { Settings } from '@/pages/Settings'

/**
 * HashRouter: robust auf GitHub Pages (kein 404 bei Reload/Deep-Link auf
 * Unterpfaden, keine SPA-Fallback-Tricks nötig). URLs: #/mounts/123 …
 */
const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'mounts', element: <Mounts /> },
      { path: 'mounts/:id', element: <MountDetail /> },
      { path: 'routes', element: <FarmRoutes /> },
      { path: 'routes/:id', element: <FarmRouteDetail /> },
      { path: 'collection', element: <Collection /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
