import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'resume:theme'

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function getInitialTheme(): Theme {
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    // Fall back to the system preference when local storage is unavailable.
  }
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeSync() {
  useEffect(() => {
    applyTheme(getInitialTheme())
  }, [])

  return null
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // The current session still follows the selected theme.
    }
  }

  const isDark = theme === 'dark'

  return (
    <button
      className="button button-secondary theme-toggle icon-button"
      type="button"
      aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
      title={isDark ? 'Use light theme' : 'Use dark theme'}
      disabled={theme === null}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun size={15} aria-hidden="true" />
      ) : (
        <Moon size={15} aria-hidden="true" />
      )}
    </button>
  )
}
