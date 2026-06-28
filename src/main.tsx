import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { AppProvider } from '@/state/AppContext'

// Theme früh anwenden (vor Render) → kein Aufblitzen des falschen Themes.
const savedTheme = (() => {
  try {
    return JSON.parse(localStorage.getItem('mc.theme') ?? '"dark"') as string
  } catch {
    return 'dark'
  }
})()
document.documentElement.classList.toggle('dark', savedTheme !== 'light')
document.documentElement.classList.toggle('light', savedTheme === 'light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
