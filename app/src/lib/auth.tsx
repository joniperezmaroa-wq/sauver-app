import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isConfigured } from './supabase'
import { db, clearLocal, getMeta, setMeta } from './db'
import { startSync, stopSync } from './sync'
import type { Profile } from './types'
import { readPref, writePref } from './storage'

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
  /** El link del mail de recuperación/invitación abrió la app: hay que elegir contraseña */
  recovering: boolean
  signOut: () => Promise<void>
  finishRecovery: () => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const raw = readPref('profile')
      return raw ? (JSON.parse(raw) as Profile) : null
    } catch {
      return null
    }
  })
  const [recovering, setRecovering] = useState(() => /type=(recovery|invite|signup)/.test(window.location.hash))

  const loadProfile = useCallback(async (s: Session) => {
    const uid = s.user.id
    if ((await getMeta('user_id')) !== uid) {
      await clearLocal()
      await setMeta('user_id', uid)
    }
    const apply = (p: Profile) => {
      setProfile(p)
      writePref('profile', JSON.stringify(p))
      if (p.role !== 'sin_acceso') startSync({ isStaff: p.role === 'admin' || p.role === 'gerencia' })
    }
    // Sin señal se entra igual con el perfil guardado; cuando hay red se actualiza.
    const cached = (await db.profiles.get(uid)) ?? null
    if (cached) apply(cached)
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
      if (data && JSON.stringify(data) !== JSON.stringify(cached)) apply(data as Profile)
    } catch {
      /* sin conexión */
    }
  }, [])

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      const cached = readPref('profile')
      const hasCached = !!cached && !!data.session && cached.includes(data.session.user.id)
      if (hasCached) setLoading(false)
      if (data.session) await loadProfile(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_IN' && s) void loadProfile(s)
      if (event === 'SIGNED_OUT') {
        stopSync()
        setProfile(null)
        writePref('profile', null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signOut = useCallback(async () => {
    stopSync()
    await supabase.auth.signOut()
    await clearLocal()
    writePref('profile', null)
    setProfile(null)
  }, [])

  return (
    <Ctx.Provider value={{ loading, session, profile, recovering, signOut, finishRecovery: () => setRecovering(false) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}

export function useMe(): Profile {
  const { profile } = useAuth()
  if (!profile) throw new Error('Sin perfil')
  return profile
}
