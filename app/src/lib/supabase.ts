import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** false si todavía no se cargaron las claves de Supabase en el hosting. */
export const isConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost', key ?? 'sin-configurar', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/** Mensaje entendible a partir de un error de Supabase o de red. */
export function errorText(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e)
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'Sin conexión. Se reintenta automáticamente.'
  if (/Invalid login credentials/i.test(msg)) return 'Mail o contraseña incorrectos.'
  if (/Email not confirmed/i.test(msg)) return 'Falta confirmar el mail: revisá tu casilla.'
  return msg
}

export function isNetworkError(e: unknown): boolean {
  const msg = (e as { message?: string })?.message ?? String(e)
  return !navigator.onLine || /Failed to fetch|NetworkError|Load failed|fetch failed|timeout/i.test(msg)
}
