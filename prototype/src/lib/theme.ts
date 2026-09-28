import { useEffect, useState } from 'react'
import { readPref, writePref } from './storage'

export type ThemePref = 'system' | 'light' | 'dark'

function apply(pref: ThemePref) {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
}

export function initTheme() {
  const p = (readPref('theme') as ThemePref | null) ?? 'system'
  apply(p)
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => (readPref('theme') as ThemePref | null) ?? 'system')
  useEffect(() => {
    apply(pref)
    writePref('theme', pref === 'system' ? null : pref)
  }, [pref])
  return { pref, setPref }
}

/** true si el tema efectivo es oscuro (para ajustar detalles de gráficos) */
export function useIsDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const read = () => {
      const t = document.documentElement.getAttribute('data-theme')
      setDark(t === 'dark' || (t !== 'light' && mq.matches))
    }
    read()
    mq.addEventListener('change', read)
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      mq.removeEventListener('change', read)
      obs.disconnect()
    }
  }, [])
  return dark
}
