// Preferencias locales del visor (tema, última experiencia). Nunca datos de negocio.
export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(`sauver:${key}`)
  } catch {
    return null
  }
}

export function writePref(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(`sauver:${key}`)
    else window.localStorage.setItem(`sauver:${key}`, value)
  } catch {
    /* almacenamiento bloqueado: se ignora */
  }
}
