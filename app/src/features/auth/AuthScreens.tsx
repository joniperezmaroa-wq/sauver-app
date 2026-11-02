import { useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, LogOut, Mail, ShieldAlert, Wrench } from 'lucide-react'
import { Logo } from '@/components/shell/Logo'
import { Button } from '@/components/ui/Button'
import { supabase, errorText } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full overflow-y-auto bg-bg">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[360px] opacity-70"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 0%, var(--accent-soft), transparent 70%)' }}
      />
      <div className="relative mx-auto flex min-h-full max-w-sm flex-col justify-center gap-8 px-5 pt-[max(32px,env(safe-area-inset-top))] pb-10">
        <Logo />
        {children}
      </div>
    </div>
  )
}

const input =
  'h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-[16px] outline-none placeholder:text-muted focus:border-accent'

type Mode = 'login' | 'signup' | 'reset'

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        setMsg({ tone: 'ok', text: 'Te enviamos un mail para confirmar la cuenta. Abrilo desde este mismo dispositivo.' })
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
        if (error) throw error
        setMsg({ tone: 'ok', text: 'Te enviamos un mail con un enlace para elegir una contraseña nueva.' })
      }
    } catch (err) {
      setMsg({ tone: 'error', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Frame>
      <div>
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
          {mode === 'login' ? 'Ingresar' : mode === 'signup' ? 'Crear mi cuenta' : 'Recuperar contraseña'}
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          {mode === 'signup'
            ? 'Usá el mail que te habilitaron en SAUVER.'
            : mode === 'reset'
              ? 'Te mandamos un enlace a tu mail.'
              : 'Gestión comercial de SAUVER.'}
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Mail" className={input} />
        {mode !== 'reset' && (
          <input
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Contraseña (mínimo 8 caracteres)' : 'Contraseña'}
            className={input}
          />
        )}
        {msg && (
          <p className={msg.tone === 'error' ? 'rounded-xl bg-crit-soft px-3 py-2 text-[13.5px] text-crit-ink' : 'rounded-xl bg-good-soft px-3 py-2 text-[13.5px] text-good-ink'}>
            {msg.text}
          </p>
        )}
        <Button type="submit" variant="primary" size="xl" disabled={busy} className="mt-1 w-full">
          {busy ? 'Un momento…' : mode === 'login' ? 'Ingresar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
        </Button>
      </form>
      <div className="flex flex-col items-start gap-2 text-[14px]">
        {mode !== 'login' && (
          <button onClick={() => setMode('login')} className="font-medium text-accent-ink">
            Ya tengo cuenta: ingresar
          </button>
        )}
        {mode !== 'signup' && (
          <button onClick={() => setMode('signup')} className="font-medium text-accent-ink">
            Primera vez: crear mi cuenta
          </button>
        )}
        {mode !== 'reset' && (
          <button onClick={() => setMode('reset')} className="text-ink-2">
            Olvidé mi contraseña
          </button>
        )}
      </div>
    </Frame>
  )
}

export function SetPasswordScreen() {
  const { finishRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <Frame>
      <div>
        <h1 className="inline-flex items-center gap-2 text-[26px] font-semibold tracking-tight">
          <KeyRound size={24} className="text-accent" /> Nueva contraseña
        </h1>
        <p className="mt-1 text-[14px] text-muted">Elegí la contraseña con la que vas a ingresar.</p>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          const { error } = await supabase.auth.updateUser({ password })
          setBusy(false)
          if (error) setErr(errorText(error))
          else {
            window.history.replaceState(null, '', '/')
            finishRecovery()
          }
        }}
      >
        <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className={input} />
        {err && <p className="rounded-xl bg-crit-soft px-3 py-2 text-[13.5px] text-crit-ink">{err}</p>}
        <Button type="submit" variant="primary" size="xl" disabled={busy}>
          Guardar y entrar
        </Button>
      </form>
    </Frame>
  )
}

export function NoAccessScreen() {
  const { signOut, session } = useAuth()
  return (
    <Frame>
      <div className="flex flex-col gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-warn-soft text-warn-ink">
          <ShieldAlert size={22} />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">Tu cuenta todavía no está habilitada</h1>
        <p className="text-[14.5px] text-ink-2">
          Ingresaste como <span className="font-medium">{session?.user.email}</span>. Pedile a Gerencia que habilite este mail en SAUVER (Usuarios) y volvé a
          ingresar.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
          Ya me habilitaron
        </Button>
        <Button variant="ghost" size="lg" onClick={() => void signOut()}>
          <LogOut size={16} /> Salir
        </Button>
      </div>
    </Frame>
  )
}

export function NotConfiguredScreen() {
  return (
    <Frame>
      <div className="flex flex-col gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-info-soft text-info-ink">
          <Wrench size={22} />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">Falta conectar la base de datos</h1>
        <p className="text-[14.5px] text-ink-2">
          La app está publicada pero todavía no tiene cargadas las claves de Supabase. Se configuran una sola vez en Vercel (variables
          <code className="mx-1 rounded bg-surface-3 px-1 font-mono text-[12.5px]">VITE_SUPABASE_URL</code>y
          <code className="mx-1 rounded bg-surface-3 px-1 font-mono text-[12.5px]">VITE_SUPABASE_ANON_KEY</code>).
        </p>
        <p className="inline-flex items-center gap-2 text-[13px] text-muted">
          <Mail size={14} /> Ver la guía en docs/puesta-en-marcha.md
        </p>
      </div>
    </Frame>
  )
}
