import { useCallback, useEffect, useState } from 'react'

const STORAGE_THEME = 'vocabMountain:theme'

export type ColorScheme = 'light' | 'dark'

function getSystemScheme(): ColorScheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function readStoredScheme(): ColorScheme | null {
  try {
    const stored = localStorage.getItem(STORAGE_THEME)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* ignore */
  }
  return null
}

function applyScheme(scheme: ColorScheme) {
  const root = document.documentElement
  root.classList.toggle('dark', scheme === 'dark')
  root.style.colorScheme = scheme
}

export function useColorScheme() {
  const [scheme, setScheme] = useState<ColorScheme>(
    () => readStoredScheme() ?? getSystemScheme(),
  )

  useEffect(() => {
    applyScheme(scheme)
    try {
      localStorage.setItem(STORAGE_THEME, scheme)
    } catch {
      /* ignore */
    }
  }, [scheme])

  const toggle = useCallback(() => {
    setScheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { scheme, isDark: scheme === 'dark', toggle, setScheme }
}
