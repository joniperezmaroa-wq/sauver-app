import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight, CloudCheck, MapPin, MessageCircle, Navigation, Sparkles } from 'lucide-react'
import { SELLER_GOALS, TODAY_ROUTE, type RouteReason } from '@/data/seller'
import { customer } from '@/data/customers'
import { orderTotal, STATUS_LABEL } from '@/data/orders'
import { useApp } from '@/lib/store'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { Photo } from '@/components/ui/Photo'
import { arsCompact, longDate } from '@/lib/format'
import { TODAY } from '@/lib/dates'
import { cn } from '@/lib/cn'

const REASON: Record<RouteReason, { label: string; cls: string }> = {
  revisita: { label: 'Revisita', cls: 'bg-accent-soft text-accent-ink' },
  recompra: { label: 'Recompra', cls: 'bg-info-soft text-info-ink' },
  demorado: { label: 'Demorado', cls: 'bg-warn-soft text-warn-ink' },
  prospecto: { label: 'Prospecto', cls: 'bg-prov-soft text-prov' },
  cobro: { label: 'Cobro', cls: 'bg-surface-3 text-ink-2' },
}

export function VendedorHoy() {
  const nav = useNavigate()
  const { state } = useApp()
  const g = SELLER_GOALS
  const visits = g.visits.done + state.visitsToday
  const myOrders = state.orders.filter((o) => o.seller === 'Tomás' && o.status !== 'cancelado').slice(0, 3)
  const salesPct = Math.round((g.sales.done / g.sales.target) * 100)

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">{longDate(TODAY)}</p>
          <h1 className="text-[24px] leading-tight font-semibold tracking-tight">Hola, Tomás</h1>
        </div>
        <button onClick={() => nav('/v/preguntar')} className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-ink" aria-label="Preguntale a Sauver">
          <Sparkles size={20} />
        </button>
      </header>

      <div className="-mt-2 inline-flex items-center gap-1.5 self-start rounded-full bg-good-soft px-2.5 py-1 text-[12px] font-medium text-good-ink">
        <CloudCheck size={14} /> Todo sincronizado · funciona sin señal
      </div>

      {/* Objetivos */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[22px] bg-ink p-4 text-bg"
      >
        <div
          className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full opacity-40 blur-2xl"
          style={{ background: 'var(--accent)' }}
        />
        <div className="relative flex items-center gap-4">
          <ProgressRing value={salesPct} size={74} stroke={7}>
            <span className="num text-[17px] font-semibold text-bg">{salesPct}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <div className="text-[12px] opacity-70">Ventas · {g.period.toLowerCase()}</div>
            <div className="num text-[22px] leading-tight font-semibold">{arsCompact(g.sales.done)}</div>
            <div className="text-[12.5px] opacity-70">Objetivo {arsCompact(g.sales.target)}</div>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
          {[
            { label: 'Visitas', done: visits, target: g.visits.target },
            { label: 'Clientes nuevos', done: g.newCustomers.done, target: g.newCustomers.target },
            { label: 'Días en calle', done: g.streetDays.done, target: g.streetDays.target },
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
                  animate={{ width: `${Math.min(100, (x.done / x.target) * 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Ruta sugerida */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold">Para visitar hoy</h2>
          <span className="text-[12.5px] text-muted">{TODAY_ROUTE.length} sugeridos</span>
        </div>
        {TODAY_ROUTE.map((stop, i) => {
          const c = customer(stop.customerId)
          const r = REASON[stop.reason]
          return (
            <motion.div
              key={stop.customerId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="overflow-hidden rounded-[20px] border border-line bg-surface"
            >
              <button onClick={() => nav(`/v/clientes/${c.id}`)} className="flex w-full gap-3 p-3 text-left">
                <Photo tone={c.photoTone} className="size-14 shrink-0 rounded-2xl" showExample={false} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold', r.cls)}>{r.label}</span>
                    <span className="inline-flex items-center gap-0.5 text-[11.5px] text-muted">
                      <MapPin size={11} />
                      {c.zone}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[15px] font-semibold">{c.name}</div>
                  <div className="truncate text-[12.5px] text-ink-2">{stop.label}</div>
                </div>
                <ChevronRight size={18} className="mt-4 shrink-0 text-muted" />
              </button>
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-line p-2">
                <button
                  onClick={() => nav(`/v/visita?c=${c.id}`)}
                  className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-accent text-[14px] font-semibold text-on-accent active:scale-[0.98]"
                >
                  Llegué
                </button>
                <a
                  href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-11 w-12 place-items-center rounded-[14px] bg-surface-3 text-ink-2"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={18} />
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-11 w-12 place-items-center rounded-[14px] bg-surface-3 text-ink-2"
                  aria-label="Cómo llegar"
                >
                  <Navigation size={18} />
                </a>
              </div>
            </motion.div>
          )
        })}
      </section>

      {/* Mis pedidos */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold">Mis pedidos</h2>
          <button onClick={() => nav('/v/pedidos')} className="text-[13px] font-medium text-accent-ink">
            Ver todos
          </button>
        </div>
        <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
          {myOrders.map((o) => (
            <button key={o.id} onClick={() => nav('/v/pedidos')} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">{customer(o.customerId).name}</div>
                <div className="text-[12px] text-muted">
                  {o.number} · {arsCompact(orderTotal(o))}
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[12px] font-medium',
                  o.status === 'listo' ? 'bg-good-soft text-good-ink' : o.status === 'enviado' ? 'bg-info-soft text-info-ink' : 'bg-surface-3 text-ink-2',
                )}
              >
                {STATUS_LABEL[o.status]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <span className="text-ink-2">Objetivo del mes</span>
          <span className="num font-medium">
            {arsCompact(g.monthSales.done)} <span className="text-muted">/ {arsCompact(g.monthSales.target)}</span>
          </span>
        </div>
        <ProgressBar value={g.monthSales.done} max={g.monthSales.target} />
      </section>
    </div>
  )
}
