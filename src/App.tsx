import { lazy, Suspense } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Code-Splitting: jede Seite wird als eigener Chunk lazy geladen. Startbündel
 * bleibt klein → schneller First Paint, auch wenn der Katalog wächst.
 * Named Exports werden auf `default` gemappt.
 */
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Mounts = lazy(() => import('@/pages/Mounts').then((m) => ({ default: m.Mounts })))
const MountDetail = lazy(() => import('@/pages/MountDetail').then((m) => ({ default: m.MountDetail })))
const FarmRoutes = lazy(() => import('@/pages/FarmRoutes').then((m) => ({ default: m.FarmRoutes })))
const FarmRouteDetail = lazy(() => import('@/pages/FarmRouteDetail').then((m) => ({ default: m.FarmRouteDetail })))
const Collection = lazy(() => import('@/pages/Collection').then((m) => ({ default: m.Collection })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

function PageFallback() {
  return (
    <div className="grid place-items-center py-24">
      <Spinner size={28} />
    </div>
  )
}

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>
}

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: withSuspense(<Dashboard />) },
      { path: 'mounts', element: withSuspense(<Mounts />) },
      { path: 'mounts/:id', element: withSuspense(<MountDetail />) },
      { path: 'routes', element: withSuspense(<FarmRoutes />) },
      { path: 'routes/:id', element: withSuspense(<FarmRouteDetail />) },
      { path: 'collection', element: withSuspense(<Collection />) },
      { path: 'settings', element: withSuspense(<Settings />) },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
