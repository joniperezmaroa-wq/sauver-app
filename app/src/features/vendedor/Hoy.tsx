import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { CalendarClock, ChevronRight, MapPin, MessageCircle, Plus, Store, UserPlus } from 'lucide-react'
import { db } from '@/lib/db'
import { useMe } from '@/lib/auth'
import { orderLabel, useCustomerMap } from '@/lib/data'
import { ProgressRing } from '@/components/ui/Progress'
import { SyncChip } from '@/components/shell/SyncChip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { arsCompact, longDate } from '@/lib/format'
import { daysBetween, today, weekStart, parseDay } from '@/lib/dates'
import { STATUS_LABEL, type Customer } from '@/lib/types'
import { waLink } from '@/lib/links'
import { cn } from '@/lib/cn'

interface Stop {
  c: Customer
  reason: 'revisita' | 'prospecto' | 'sin_visita' | 'nuevo'
  label: string
  prio: number
}

export function VendedorHoy() {
  const me = useMe()
  const nav = useNavigate()
  const customers = useCustomerMap()

  const data = useLiveQuery(async () => {
    const ws = weekStart().toISOString()
    const [mine, visits, orders, target] = await Promise.all([
      db.customers.where('owner_id').equals(me.id).toArray(),
      db.visits.where('seller_id').equals(me.id).toArray(),
      db.orders.where('seller_id').equals(me.id).toArray(),
      db.targets.get(me.id),
    ])
    const weekVisits = visits.filter((v) => v.visited_at >= ws).length
    const weekNew = mine.filter((c) => c.created_at >= ws).length
    const weekOrders = orders.filter((o) => o.created_at >= ws && o.status !== 'cancelado')
    const weekSales = weekOrders.reduce((s, o) => s + Number(o.total), 0)

    const lastVisit = new Map<string, (typeof visits)[number]>()
    for (const v of visits) {
      const prev = lastVisit.get(v.customer_id)
      if (!prev || v.visited_at > prev.visited_at) lastVisit.set(v.customer_id, v)
    }
    const t0 = today()
    const stops: Stop[] = []
    for (const c of mine) {
      if (c.status === 'inactivo') continue
      const lv = lastVisit.get(c.id)
      if (lv?.next_visit && parseDay(lv.next_visit) <= t0) {
        const d = daysBetween(parseDay(lv.next_visit), t0)
        stops.push({ c, reason: 'revisita', label: d === 0 ? 'Revisita agendada para hoy' : `Revisita atrasada ${d} días`, prio: 0 })
      } else if (!lv) {
        stops.push({ c, reason: 'nuevo', label: 'Todavía sin visitas registradas', prio: 2 })
      } else {
        const since = daysBetween(new Date(lv.visited_at), t0)
        if (c.status === 'prospecto' && since >= 7) stops.push({ c, reason: 'prospecto', label: `Prospecto · última visita hace ${since} días`, prio: 1 })
        else if (since >= 14) stops.push({ c, reason: 'sin_visita', label: `Sin visita hace ${since} días`, prio: 1 })
      }
    }
    stops.sort((a, b) => a.prio - b.prio)
    return {
      weekVisits,
      weekNew,
      weekSales,
      weekOrders: weekOrders.length,
      target,
      stops: stops.slice(0, 8),
      recent: orders.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3),
      customersCount: mine.length,
    }
  }, [me.id])

  if (!data) return null
  const t = data.target
  const salesTarget = Number(t?.weekly_sales ?? 0)
  const salesPct = salesTarget > 0 ? Math.round((data.weekSales / salesTarget) * 100) : 0

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">{longDate(new Date())}</p>
          <h1 className="text-[24px] leading-tight font-semibold tracking-tight">Hola, {me.full_name.split(' ')[0] || 'vendedor'}</h1>
        </div>
        <SyncChip className="mt-1" />
      </header>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[22px] bg-ink p-4 text-bg">
        <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full opacity-40 blur-2xl" style={{ background: 'var(--accent)' }} />
        <div className="relative flex items-center gap-4">
          <ProgressRing value={salesTarget ? Math.min(salesPct, 100) : 0} size={74} stroke={7}>
            <span className="num text-[16px] font-semibold text-bg">{salesTarget ? `${salesPct}%` : '—'}</span>
          </ProgressRing>
          <div className="min-w-0">
            <div className="text-[12px] opacity-70">Ventas de esta semana</div>
            <div className="num text-[22px] leading-tight font-semibold">{arsCompact(data.weekSales)}</div>
            <div className="text-[12.5px] opacity-70">
              {salesTarget ? `Objetivo ${arsCompact(salesTarget)}` : 'Objetivo semanal a definir'} · {data.weekOrders} pedidos
            </div>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
          {[
            { label: 'Visitas', done: data.weekVisits, target: t?.weekly_visits ?? 12 },
            { label: 'Clientes nuevos', done: data.weekNew, target: t?.weekly_new_customers ?? 2 },
          ].map((x) => (
            <div key={x.label} className="flex flex-col gap-1.5">
              <span className="text-[11.5px] opacity-70">{x.label}</span>
              <span className="num text-[16px] font-semibold">
                {x.done}
                <span className="text-[12px] font-normal opacity-60">/{x.target}</span>
              </span>
              <div className="h-1 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent-ink)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (x.done / Math.max(1, x.target)) * 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold">Para visitar</h2>
          <button onClick={() => nav('/v/clientes')} className="text-[13px] font-medium text-accent-ink">
            Todos mis clientes
          </button>
        </div>
        {data.customersCount === 0 ? (
          <div className="rounded-[20px] border border-line bg-surface">
            <EmptyState
              icon={<Store size={24} />}
              title="Todavía no tenés clientes cargados"
              body="Registrá tu primera visita: si el comercio es nuevo, lo creás en el momento con nombre y canal."
              action={
                <Button variant="primary" size="lg" onClick={() => nav('/v/visita')}>
                  <Plus size={17} /> Nueva visita
                </Button>
              }
            />
          </div>
        ) : data.stops.length === 0 ? (
          <p className="rounded-[20px] border border-line bg-surface px-4 py-6 text-center text-[14px] text-muted">
            No hay revisitas pendientes. Buen momento para sumar clientes nuevos.
          </p>
        ) : (
          data.stops.map((s, i) => (
            <motion.div
              key={s.c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className="overflow-hidden rounded-[20px] border border-line bg-surface"
            >
              <button onClick={() => nav(`/v/clientes/${s.c.id}`)} className="flex w-full items-center gap-3 p-3 text-left">
                <span
                  className={cn(
                    'grid size-12 shrink-0 place-items-center rounded-2xl',
                    s.reason === 'revisita' ? 'bg-accent-soft text-accent-ink' : s.reason === 'prospecto' ? 'bg-prov-soft text-prov' : 'bg-surface-3 text-ink-2',
                  )}
                >
                  {s.reason === 'revisita' ? <CalendarClock size={20} /> : s.reason === 'prospecto' ? <UserPlus size={20} /> : <Store size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">{s.c.name}</div>
                  <div className="truncate text-[12.5px] text-ink-2">{s.label}</div>
                  {s.c.zone && (
                    <div className="inline-flex items-center gap-0.5 text-[11.5px] text-muted">
                      <MapPin size={11} /> {s.c.zone}
                    </div>
                  )}
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted" />
              </button>
              <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-line p-2">
                <button
                  onClick={() => nav(`/v/visita?c=${s.c.id}`)}
                  className="flex h-11 items-center justify-center rounded-[14px] bg-accent text-[14px] font-semibold text-on-accent active:scale-[0.98]"
                >
                  Llegué
                </button>
                {s.c.whatsapp ? (
                  <a href={waLink(s.c.whatsapp)} target="_blank" rel="noreferrer" className="grid h-11 w-12 place-items-center rounded-[14px] bg-surface-3 text-ink-2" aria-label="WhatsApp">
                    <MessageCircle size={18} />
                  </a>
                ) : (
                  <span className="w-12" />
                )}
              </div>
            </motion.div>
          ))
        )}
      </section>

      {data.recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-semibold">Mis pedidos</h2>
            <button onClick={() => nav('/v/pedidos')} className="text-[13px] font-medium text-accent-ink">
              Ver todos
            </button>
          </div>
          <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
            {data.recent.map((o) => (
              <button key={o.id} onClick={() => nav(`/v/pedidos?o=${o.id}`)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{customers.get(o.customer_id)?.name ?? 'Cliente'}</div>
                  <div className="text-[12px] text-muted">
                    {o._pending ? arsCompact(Number(o.total)) : `${orderLabel(o)} · ${arsCompact(Number(o.total))}`}
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[12px] font-medium',
                    o._pending ? 'bg-warn-soft text-warn-ink' : o.status === 'listo' ? 'bg-good-soft text-good-ink' : o.status === 'nuevo' ? 'bg-info-soft text-info-ink' : 'bg-surface-3 text-ink-2',
                  )}
                >
                  {o._pending ? 'Por enviar' : STATUS_LABEL[o.status]}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
