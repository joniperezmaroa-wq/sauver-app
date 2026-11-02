import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, CalendarClock, MapPin, MessageCircle, Navigation, Pencil, Plus, ShoppingBag } from 'lucide-react'
import { db } from '@/lib/db'
import { useMe } from '@/lib/auth'
import { orderLabel, useCustomer, useOrders, useProfiles, useVisits } from '@/lib/data'
import { photoUrl, syncNow } from '@/lib/sync'
import { supabase, errorText } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { STATUS_TEXT, STATUS_TONE } from './Clientes'
import { ars, dayMonth } from '@/lib/format'
import { daysBetween, parseDay, timeHM, today } from '@/lib/dates'
import { mapsLink, waLink } from '@/lib/links'
import { OUTCOME_LABEL, STATUS_LABEL, type Visit } from '@/lib/types'
import { cn } from '@/lib/cn'

export function Ficha({ base }: { base: string }) {
  const { id = '' } = useParams()
  const me = useMe()
  const nav = useNavigate()
  const c = useCustomer(id)
  const visits = useVisits({ customerId: id }) ?? []
  const orders = useOrders({ customerId: id }) ?? []
  const bal = useLiveQuery(() => db.balances.get(id), [id])
  const profiles = useProfiles()
  const seller = me.role === 'vendedor'

  if (c === undefined) return null
  if (c === null) return <p className="p-6 text-muted">Cliente no encontrado.</p>

  const next = visits.find((v) => v.next_visit)?.next_visit
  const lastVisit = visits[0]
  type Ev = { at: string; kind: 'visita'; v: Visit } | { at: string; kind: 'pedido'; o: (typeof orders)[number] }
  const events: Ev[] = [
    ...visits.map((v) => ({ at: v.visited_at, kind: 'visita' as const, v })),
    ...orders.map((o) => ({ at: o.created_at, kind: 'pedido' as const, o })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  return (
    <div className={cn('flex flex-col gap-4', seller && 'px-3 pt-3 pb-10')}>
      <div className="relative overflow-hidden rounded-[22px] bg-ink p-5 text-bg">
        <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full opacity-30 blur-2xl" style={{ background: 'var(--accent)' }} />
        <div className="relative flex items-start justify-between gap-3">
          <button onClick={() => nav(-1)} className="-ml-1 grid size-9 place-items-center rounded-full bg-white/10" aria-label="Volver">
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            {c.whatsapp && (
              <a href={waLink(c.whatsapp)} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full bg-white text-[#0d1411]" aria-label="WhatsApp">
                <MessageCircle size={18} />
              </a>
            )}
            {c.address && (
              <a href={mapsLink(`${c.address} ${c.zone ?? ''}`)} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full bg-white/15" aria-label="Cómo llegar">
                <Navigation size={17} />
              </a>
            )}
            <button onClick={() => nav(`${base}/clientes/${c.id}/editar`)} className="grid size-10 place-items-center rounded-full bg-white/15" aria-label="Editar">
              <Pencil size={16} />
            </button>
          </div>
        </div>
        <div className="relative mt-6">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <Badge tone={STATUS_TONE[c.status]}>{STATUS_TEXT[c.status]}</Badge>
            <span className="inline-flex h-6 items-center rounded-full bg-white/15 px-2.5 text-[12px] font-medium">{c.channel}</span>
            {c._pending && <Badge tone="warn">Por enviar</Badge>}
          </div>
          <h2 className="text-[26px] leading-tight font-semibold tracking-tight">{c.name}</h2>
          <p className="mt-1 text-[13px] text-white/75">
            {[c.address, c.zone].filter(Boolean).join(' · ') || 'Sin dirección'}
            {c.contact_name ? ` · ${c.contact_name}` : ''}
          </p>
          {c.whatsapp && <p className="num mt-0.5 text-[12.5px] text-white/60 select-all">{c.whatsapp}</p>}
        </div>
      </div>

      {seller && (
        <Button variant="primary" size="xl" onClick={() => nav(`/v/visita?c=${c.id}`)}>
          <Plus size={18} /> Registrar visita
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2 @3xl:grid-cols-4">
        <Mini label="Última visita" value={lastVisit ? relDays(daysBetween(new Date(lastVisit.visited_at), new Date())) : '—'} sub={lastVisit ? OUTCOME_LABEL[lastVisit.outcome] : 'Sin visitas'} />
        <Mini
          label="Próxima visita"
          value={next ? dayMonth(parseDay(next)) : '—'}
          sub={next ? (parseDay(next) < today() ? 'Atrasada' : 'Agendada') : 'Sin agendar'}
          tone={next && parseDay(next) < today() ? 'warn' : undefined}
        />
        <Mini label="Pedidos" value={String(orders.filter((o) => o.status !== 'cancelado').length)} sub={`Condición: ${c.payment_term}`} />
        <Mini
          label="Saldo"
          value={bal ? ars(Number(bal.balance)) : '—'}
          sub={bal ? (Number(bal.overdue) > 0 ? `${ars(Number(bal.overdue))} vencido` : 'Sin vencidos') : 'Sin cargar'}
          tone={bal && Number(bal.overdue) > 0 ? 'crit' : undefined}
        />
      </div>

      {!seller && <BalanceEditor customerId={c.id} balance={Number(bal?.balance ?? 0)} overdue={Number(bal?.overdue ?? 0)} />}

      <Card>
        <CardHeader title="Historial" sub="Visitas, fotos y pedidos" />
        {events.length === 0 && <p className="px-5 py-6 text-[13.5px] text-muted">Todavía no hay actividad registrada.</p>}
        <ol className="flex flex-col px-5 pt-4 pb-5">
          {events.map((e, i) => (
            <li key={e.kind + (e.kind === 'visita' ? e.v.id : e.o.id)} className="relative flex gap-3 pb-4 last:pb-0">
              {i < events.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
              <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-ink-2">
                {e.kind === 'visita' ? <MapPin size={15} /> : <ShoppingBag size={15} />}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                {e.kind === 'visita' ? (
                  <>
                    <div className="text-[14px] font-medium">
                      Visita · {OUTCOME_LABEL[e.v.outcome]}
                      {e.v._pending && <Badge tone="warn" className="ml-2 h-5 align-middle">Por enviar</Badge>}
                    </div>
                    <div className="text-[12.5px] text-muted">
                      {dayMonth(new Date(e.v.visited_at))} {timeHM(new Date(e.v.visited_at))}
                      {!seller && profiles.get(e.v.seller_id) ? ` · ${profiles.get(e.v.seller_id)!.full_name}` : ''}
                    </div>
                    {(e.v.objections.length > 0 || e.v.interest.length > 0 || e.v.reason) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[...e.v.interest, ...e.v.objections, ...(e.v.reason ? [e.v.reason] : [])].map((t) => (
                          <span key={t} className="rounded-full bg-surface-3 px-2 py-0.5 text-[11.5px] text-ink-2">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {e.v.comment && <p className="mt-1 text-[13px] text-ink-2">{e.v.comment}</p>}
                    {e.v.next_visit && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-accent-ink">
                        <CalendarClock size={13} /> Volver el {dayMonth(parseDay(e.v.next_visit))}
                      </p>
                    )}
                    {e.v.photo_path && <VisitPhoto visit={e.v} />}
                  </>
                ) : (
                  <button className="block w-full text-left" onClick={() => nav(`${base}/pedidos?o=${e.o.id}`)}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[14px] font-medium">
                        {e.o._pending ? 'Pedido · por enviar' : `Pedido ${orderLabel(e.o)} · ${STATUS_LABEL[e.o.status]}`}
                      </span>
                      <span className="num shrink-0 text-[13.5px] font-medium">{ars(Number(e.o.total))}</span>
                    </div>
                    <div className="text-[12.5px] text-muted">
                      {dayMonth(new Date(e.o.created_at))} · {e.o.payment_term}
                    </div>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {(c.legal_name || c.cuit || c.notes || c.email) && (
        <Card>
          <CardHeader title="Datos" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-5 pt-3 pb-4 text-[13.5px]">
            {c.legal_name && (
              <>
                <dt className="text-muted">Razón social</dt>
                <dd>{c.legal_name}</dd>
              </>
            )}
            {c.cuit && (
              <>
                <dt className="text-muted">CUIT</dt>
                <dd className="num">{c.cuit}</dd>
              </>
            )}
            {c.email && (
              <>
                <dt className="text-muted">Mail</dt>
                <dd className="select-all">{c.email}</dd>
              </>
            )}
            {!seller && (
              <>
                <dt className="text-muted">Responsable</dt>
                <dd>{profiles.get(c.owner_id)?.full_name ?? '—'}</dd>
              </>
            )}
            {c.notes && (
              <>
                <dt className="text-muted">Notas</dt>
                <dd className="whitespace-pre-wrap">{c.notes}</dd>
              </>
            )}
          </dl>
        </Card>
      )}
    </div>
  )
}

function relDays(d: number): string {
  return d === 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`
}

function Mini({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'crit' | 'warn' }) {
  return (
    <Card className="px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="num text-[18px] leading-tight font-semibold tracking-tight">{value}</div>
      {sub && <div className={cn('text-[12px]', tone ? `text-${tone}-ink` : 'text-muted')}>{sub}</div>}
    </Card>
  )
}

function VisitPhoto({ visit }: { visit: Visit }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void photoUrl(visit.id, visit.photo_path).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [visit.id, visit.photo_path])
  if (!url) return <div className="mt-2 h-36 w-full max-w-xs animate-pulse rounded-xl bg-surface-3" />
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Foto de la visita" loading="lazy" className="mt-2 h-44 w-full max-w-xs rounded-xl object-cover" />
    </a>
  )
}

/** Saldo y vencido: por ahora los carga Administración (más adelante llegan del import de Dux). */
function BalanceEditor({ customerId, balance, overdue }: { customerId: string; balance: number; overdue: number }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [b, setB] = useState(String(balance))
  const [o, setO] = useState(String(overdue))
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="self-start text-[13px] font-medium text-accent-ink">
        Actualizar saldo y vencido
      </button>
    )
  return (
    <Card className="flex flex-wrap items-end gap-3 p-4">
      <label className="flex flex-col gap-1 text-[12.5px] text-muted">
        Saldo
        <input id="bal" inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} className="h-10 w-36 rounded-xl border border-line-strong bg-surface px-3 text-[15px] text-ink" />
      </label>
      <label className="flex flex-col gap-1 text-[12.5px] text-muted">
        Vencido
        <input id="ovd" inputMode="numeric" value={o} onChange={(e) => setO(e.target.value)} className="h-10 w-36 rounded-xl border border-line-strong bg-surface px-3 text-[15px] text-ink" />
      </label>
      <Button
        variant="primary"
        onClick={async () => {
          const num = (s: string) => Number(s.replace(/\./g, '').replace(',', '.')) || 0
          const { error } = await supabase.from('customer_balances').upsert({ customer_id: customerId, balance: num(b), overdue: num(o) })
          if (error) return toast({ title: 'No se pudo guardar', body: errorText(error), tone: 'error' })
          toast({ title: 'Saldo actualizado' })
          setOpen(false)
          void syncNow()
        }}
      >
        Guardar
      </Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </Card>
  )
}
