export type ThemePref = 'light' | 'dark' | 'system'

const media = window.matchMedia('(prefers-color-scheme: dark)')
let current: ThemePref = 'system'

function resolved(pref: ThemePref) {
  return pref === 'system' ? (media.matches ? 'dark' : 'light') : pref
}

export function applyTheme(pref: ThemePref) {
  current = pref
  const mode = resolved(pref)
  document.documentElement.dataset.theme = mode
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', mode === 'dark' ? '#000000' : '#f2f2f7'))
  try {
    localStorage.setItem('tk-theme', pref)
  } catch {
    /* private mode: the server copy still applies on next login */
  }
}

media.addEventListener('change', () => current === 'system' && applyTheme('system'))

// Apply the remembered choice before first paint to avoid a flash.
try {
  applyTheme((localStorage.getItem('tk-theme') as ThemePref) || 'system')
} catch {
  applyTheme('system')
}
