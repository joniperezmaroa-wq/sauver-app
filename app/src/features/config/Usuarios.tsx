import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase, errorText } from '@/lib/supabase'
import { syncNow } from '@/lib/sync'
import { useProfiles } from '@/lib/data'
import { useToast } from '@/lib/toast'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type AllowedRole = 'gerencia' | 'admin' | 'vendedor'
interface Allowed {
  email: string
  full_name: string
  role: AllowedRole
}
const ROLE_TEXT: Record<string, string> = { gerencia: 'Gerencia', admin: 'Administración', vendedor: 'Vendedor', sin_acceso: 'Sin acceso' }
const inp = 'h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px] outline-none focus:border-accent'

/** Solo Gerencia: qué mails pueden entrar y con qué rol. */
export function Usuarios() {
  const toast = useToast()
  const profiles = useProfiles()
  const [allowed, setAllowed] = useState<Allowed[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<AllowedRole>('vendedor')

  const load = async () => {
    const { data, error } = await supabase.from('allowed_users').select('*').order('created_at')
    if (error) toast({ title: 'No se pudo cargar', body: errorText(error), tone: 'error' })
    else setAllowed(data as Allowed[])
  }
  useEffect(() => {
    void load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const byEmail = new Map([...profiles.values()].map((p) => [p.email.toLowerCase(), p]))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight">Usuarios</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          Habilitá el mail y el rol. Después la persona entra a la app, toca “Primera vez: crear mi cuenta” con ese mismo mail y confirma desde su casilla.
        </p>
      </div>
      <Card>
        <CardHeader title="Habilitar a una persona" />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <input id="u-email" type="email" placeholder="mail@ejemplo.com" className={inp} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input id="u-name" placeholder="Nombre" className={inp} value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-2 sm:col-span-2">
            {(['vendedor', 'admin', 'gerencia'] as AllowedRole[]).map((r) => (
              <button key={r} onClick={() => setRole(r)} className={`h-10 flex-1 rounded-xl border text-[13.5px] ${role === r ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line'}`}>
                {ROLE_TEXT[r]}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            className="sm:col-span-2"
            disabled={!email.includes('@') || !name.trim()}
            onClick={async () => {
              const { error } = await supabase.from('allowed_users').upsert({ email: email.trim().toLowerCase(), full_name: name.trim(), role })
              if (error) return toast({ title: 'No se pudo habilitar', body: errorText(error), tone: 'error' })
              toast({ title: `${name} habilitado como ${ROLE_TEXT[role]}` })
              setEmail('')
              setName('')
              void load()
              void syncNow()
            }}
          >
            <Plus size={16} /> Habilitar
          </Button>
        </div>
      </Card>
      <Card>
        <CardHeader title="Habilitados" />
        <div className="flex flex-col p-2">
          {allowed.map((a) => {
            const p = byEmail.get(a.email.toLowerCase())
            return (
              <div key={a.email} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-ink text-[13px] font-semibold text-bg">{a.full_name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{a.full_name}</div>
                  <div className="truncate text-[12.5px] text-muted">{a.email}</div>
                </div>
                <Badge tone="accent">{ROLE_TEXT[a.role]}</Badge>
                {p ? <Badge tone="good">Cuenta creada</Badge> : <Badge>Sin cuenta aún</Badge>}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
