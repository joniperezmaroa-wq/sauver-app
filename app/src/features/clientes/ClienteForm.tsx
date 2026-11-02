import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMe } from '@/lib/auth'
import { useCustomer, useProfiles, useSettings } from '@/lib/data'
import { newCustomer, saveCustomer } from '@/lib/actions'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/Button'
import { CHANNELS, type Customer, type CustomerStatus } from '@/lib/types'
import { cn } from '@/lib/cn'

/** Alta y edición de cliente. Funciona sin señal (se envía al volver). */
export function ClienteForm({ base }: { base: string }) {
  const { id } = useParams()
  const existing = useCustomer(id)
  if (id && existing === undefined) return null
  if (id && existing === null) return <p className="p-6 text-muted">Cliente no encontrado.</p>
  return <Form base={base} initial={existing ?? null} />
}

function Form({ base, initial }: { base: string; initial: Customer | null }) {
  const me = useMe()
  const nav = useNavigate()
  const toast = useToast()
  const settings = useSettings()
  const profiles = useProfiles()
  const staff = me.role !== 'vendedor'
  const [c, setC] = useState<Customer>(() => initial ?? newCustomer(me.id, { payment_term: settings.payment_terms[0] ?? 'Contado' }))
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setC((x) => ({ ...x, [k]: v }))
  const txt = (k: keyof Customer) => ({
    value: (c[k] as string | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, (e.target.value || null) as never),
  })
  const sellers = [...profiles.values()].filter((p) => p.role !== 'sin_acceso' && p.active)

  return (
    <div className={cn('mx-auto flex w-full max-w-xl flex-col gap-5', !staff && 'px-4 pt-3 pb-10')}>
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="grid size-10 place-items-center rounded-full hover:bg-surface-3" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[22px] font-semibold tracking-tight">{initial ? 'Editar cliente' : 'Cliente nuevo'}</h2>
      </div>

      <F label="Nombre del comercio *">
        <input id="c-name" className={inp} {...txt('name')} value={c.name} onChange={(e) => set('name', e.target.value)} />
      </F>
      <F label="Canal">
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((ch) => (
            <button key={ch} onClick={() => set('channel', ch)} className={cn('h-10 rounded-full border px-4 text-[14px] font-medium', c.channel === ch ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-ink-2')}>
              {ch}
            </button>
          ))}
        </div>
      </F>
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
        <F label="Zona o barrio">
          <input id="c-zone" className={inp} {...txt('zone')} />
        </F>
        <F label="Dirección">
          <input id="c-address" className={inp} {...txt('address')} />
        </F>
        <F label="Contacto">
          <input id="c-contact" className={inp} {...txt('contact_name')} />
        </F>
        <F label="WhatsApp">
          <input id="c-wa" inputMode="tel" className={inp} {...txt('whatsapp')} />
        </F>
        <F label="Mail">
          <input id="c-email" type="email" className={inp} {...txt('email')} />
        </F>
        <F label="Condición de pago habitual">
          <select id="c-term" className={inp} value={c.payment_term} onChange={(e) => set('payment_term', e.target.value)}>
            {[...new Set([c.payment_term, ...settings.payment_terms])].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </F>
        <F label="Razón social">
          <input id="c-legal" className={inp} {...txt('legal_name')} />
        </F>
        <F label="CUIT">
          <input id="c-cuit" inputMode="numeric" className={inp} {...txt('cuit')} />
        </F>
      </div>
      <F label="Notas">
        <textarea id="c-notes" rows={3} className={cn(inp, 'h-auto py-3')} {...txt('notes')} />
      </F>

      {staff && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface-2 p-4 @lg:grid-cols-2">
          <F label="Responsable">
            <select id="c-owner" className={inp} value={c.owner_id} onChange={(e) => set('owner_id', e.target.value)}>
              {sellers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </F>
          <F label="Estado">
            <select id="c-status" className={inp} value={c.status} onChange={(e) => set('status', e.target.value as CustomerStatus)}>
              <option value="prospecto">Prospecto</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </F>
          <F label="Código en Dux Sauver">
            <input id="c-dux-s" className={inp} {...txt('dux_code_sauver')} />
          </F>
          <F label="Código en Dux Joni">
            <input id="c-dux-j" className={inp} {...txt('dux_code_joni')} />
          </F>
        </div>
      )}

      <Button
        variant="primary"
        size="xl"
        disabled={!c.name.trim() || busy}
        onClick={async () => {
          setBusy(true)
          await saveCustomer({ ...c, name: c.name.trim() })
          toast({ title: initial ? 'Cliente actualizado' : 'Cliente creado' })
          nav(`${base}/clientes/${c.id}`, { replace: true })
        }}
      >
        Guardar
      </Button>
    </div>
  )
}

const inp = 'h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-[16px] outline-none focus:border-accent'

function F({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
    </label>
  )
}
