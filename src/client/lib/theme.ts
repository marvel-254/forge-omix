export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'forge-theme'

/**
 * Dark is the product default; light is opt-in and persisted once chosen.
 * Unknown/absent storage resolves to dark rather than flashing light first.
 */
export function getStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'dark'
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    void 0
  }
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  applyTheme(next)
  return next
}
