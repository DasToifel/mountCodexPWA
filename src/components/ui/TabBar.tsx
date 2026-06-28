import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

interface Tab {
  to: string
  label: string
  icon: ReactNode
}

const I = (path: string) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d={path} />
  </svg>
)

const TABS: Tab[] = [
  { to: '/', label: 'Übersicht', icon: I('M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z') },
  {
    to: '/mounts',
    label: 'Mounts',
    icon: I('M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm3 1v12h2V6H7Zm4 0v12h6V6h-6Z'),
  },
  {
    to: '/routes',
    label: 'Routen',
    icon: I('m9 3 6 2 5-2v16l-5 2-6-2-5 2V5l5-2Zm0 2.2L6 6.4v12.4l3-1.2V5.2Zm2 .1v12.4l2 .7V6l-2-.7Z'),
  },
  {
    to: '/collection',
    label: 'Sammlung',
    icon: I('M12 2a10 10 0 1 0 10 10h-10V2Zm-2 .5A10 10 0 0 0 2.5 10H10V2.5Z'),
  },
  {
    to: '/settings',
    label: 'Mehr',
    icon: I('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4 2-1.5-2-3.4-2.4.7a7 7 0 0 0-1.3-.8L15 4H9l-.3 2.7a7 7 0 0 0-1.3.8L5 6.8 3 10.2 5 12l-2 1.8 2 3.4 2.4-.7c.4.3.8.6 1.3.8L9 20h6l.3-2.7c.5-.2.9-.5 1.3-.8l2.4.7 2-3.4L21 12Z'),
  },
]

/** Untere Tab Bar – glasig, mit Safe-Area-Abstand (iPhone Home-Indicator). */
export function TabBar() {
  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-separator"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-gold' : 'text-ink-3'
                }`
              }
            >
              {tab.icon}
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
