import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import {
  ArrowLeft,
  Camera,
  CircleDollarSign,
  ClipboardList,
  MapPin,
  MessageCircle,
  NotebookPen,
  Phone,
  Plus,
  RotateCcw,
  ShoppingBag,
  Truck,
  CalendarClock,
} from 'lucide-react'
import { customer, repurchaseDelay, timelineFor, type TimelineKind } from '@/data/customers'
import { product } from '@/data/catalog'
import type { Role } from '@/data/people'
import { Photo } from '@/components/ui/Photo'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTag } from '@/components/ui/DataTag'
import { ChartTip, axisProps } from '@/components/charts/ChartKit'
import { STATE_TONE } from './Clientes'
import { ars, arsCompact, dayMonth, int, monthShort, pct } from '@/lib/format'
import { TODAY } from '@/lib/dates'
import { cn } from '@/lib/cn'

const KIND_ICON: Record<TimelineKind, typeof Camera> = {
  foto: Camera,
  visita: MapPin,
  pedido: ShoppingBag,
  entrega: Truck,
  cobro: CircleDollarSign,
  nota: NotebookPen,
  seguimiento: CalendarClock,
}

export function Ficha({ role }: { role: Role }) {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const c = customer(id)
  const delay = repurchaseDelay(c)
  const events = timelineFor(c)
  const seller = role === 'vendedor'
  const months = Array.from({ length: 12 }, (_, i) => (8 + i + 1) % 12)
  const chartData = c.history.map((u, i) => ({ m: monthShort(months[i]), u }))
  const photos = events.filter((e) => e.kind === 'foto')

  return (
    <div className={cn('flex flex-col gap-4', !seller && '@3xl:gap-5')}>
      {/* Portada */}
      <div className="relative overflow-hidden rounded-[22px]">
        <Photo tone={c.photoTone} className={cn('w-full', seller ? 'h-48' : 'h-48 @3xl:h-56')} showExample={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <button
          onClick={() => nav(-1)}
          className="absolute top-3 left-3 grid size-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white @3xl:p-5">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              <Badge tone={STATE_TONE[c.state]}>{c.state}</Badge>
              <span className="inline-flex h-6 items-center rounded-full bg-white/20 px-2.5 text-[12px] font-medium backdrop-blur-md">{c.channel}</span>
            </div>
            <h2 className="text-[24px] leading-tight font-semibold tracking-tight @3xl:text-[30px]">{c.name}</h2>
            <p className="text-[13px] text-white/80">
              {c.address} · {c.contact}
            </p>
            <p className="mt-1 text-[11px] text-white/60">Foto de ejemplo</p>
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <a
              href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="grid size-10 place-items-center rounded-full bg-white text-[#0d1411]"
              aria-label="WhatsApp"
              title={c.whatsapp}
            >
              <MessageCircle size={18} />
            </a>
            <span className="grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur-md" title={c.whatsapp}>
              <Phone size={17} />
            </span>
          </div>
        </div>
      </div>

      {/* Recompra */}
      {c.frequencyDays != null && c.lastPurchaseDaysAgo != null && (
        <Card className="flex flex-col gap-3 p-4 @lg:flex-row @lg:items-center">
          <div className="flex flex-1 items-center gap-3">
            <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', (delay ?? 0) > 0 ? 'bg-warn-soft text-warn-ink' : 'bg-accent-soft text-accent-ink')}>
              <RotateCcw size={18} />
            </span>
            <div>
              <div className="text-[14.5px] font-semibold">
                {(delay ?? 0) > 0 ? `Recompra demorada ${delay} días` : delay != null && delay >= -3 ? `Recompra en ${-delay} días` : 'En frecuencia'}
              </div>
              <div className="text-[13px] text-muted">
                Suele comprar cada {c.frequencyDays} días · última compra hace {c.lastPurchaseDaysAgo}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative h-2 rounded-full bg-surface-3">
              <div
                className={cn('absolute inset-y-0 left-0 rounded-full', (delay ?? 0) > 0 ? 'bg-warn' : 'bg-accent')}
                style={{ width: `${Math.min(100, (c.lastPurchaseDaysAgo / (c.frequencyDays * 1.6)) * 100)}%` }}
              />
              <div className="absolute -top-1 h-4 w-0.5 rounded bg-ink" style={{ left: `${(1 / 1.6) * 100}%` }} title="Frecuencia habitual" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11.5px] text-muted">
              <span>Última compra</span>
              <span>Día {c.frequencyDays}</span>
              <span>Hoy</span>
            </div>
          </div>
          {seller && (
            <Button variant="primary" size="lg" onClick={() => nav(`/v/visita?c=${c.id}`)}>
              <Plus size={17} /> Visita
            </Button>
          )}
        </Card>
      )}

      {/* Números */}
      <div className="grid grid-cols-2 gap-2 @3xl:grid-cols-4 @3xl:gap-3">
        <Metric label="Compra mensual" value={c.monthlyAvg ? arsCompact(c.monthlyAvg) : '—'} sub={c.trend ? `${pct(c.trend, true)} en 6 meses` : 'Promedio 6 meses'} tone={c.trend < -5 ? 'crit' : c.trend > 5 ? 'good' : undefined} />
        <Metric label="Ticket promedio" value={c.ticketAvg ? arsCompact(c.ticketAvg) : '—'} sub={`${int(c.units12m)} u. en 12 meses`} />
        <Metric label="Saldo" value={ars(c.balance)} sub={c.overdue ? `${ars(c.overdue)} vencido` : 'Sin vencidos'} tone={c.overdue ? 'crit' : undefined} />
        <Metric
          label="Días reales de pago"
          value={c.realPaymentDays != null ? `${c.realPaymentDays} d` : '—'}
          sub={`Condición: ${c.paymentTerm}`}
          tone={c.realPaymentDays != null && c.realPaymentDays > (Number(c.paymentTerm.match(/\d+/)?.[0] ?? 0) + 5) ? 'warn' : undefined}
        />
      </div>

      <div className={cn('grid grid-cols-1 gap-4', !seller && '@4xl:grid-cols-3')}>
        <div className={cn('flex flex-col gap-4', !seller && '@4xl:col-span-2')}>
          {/* Evolución */}
          {c.units12m > 0 && (
            <Card>
              <CardHeader title="Unidades por mes" sub="Últimos 12 meses · Sauver" action={<DataTag kind="real" />} />
              <div className="h-44 px-2 pt-3 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 12, left: 12, bottom: 0 }} barCategoryGap="22%">
                    <XAxis dataKey="m" {...axisProps} dy={4} interval={seller ? 1 : 0} />
                    <Tooltip
                      cursor={{ fill: 'var(--surface-3)', radius: 6 }}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <ChartTip title={(payload[0].payload as { m: string }).m} rows={[{ label: 'Unidades', value: int(payload[0].value as number), kind: 'real' }]} />
                        ) : null
                      }
                    />
                    <Bar dataKey="u" radius={[4, 4, 0, 0]} maxBarSize={24}>
                      {chartData.map((d, i) => (
                        <Cell key={d.m} fill={i === chartData.length - 1 ? 'var(--accent)' : 'color-mix(in oklab, var(--accent) 55%, var(--surface))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Historial visual */}
          <Card>
            <CardHeader title="Historial" sub="Visitas, fotos, pedidos, entregas y cobros" />
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-5 pt-4 scrollbar-none">
                {photos.map((p) => (
                  <div key={p.id} className="shrink-0">
                    <Photo tone={p.photoTone} className="h-24 w-32 rounded-xl" showExample={false} />
                    <div className="mt-1 text-[11.5px] text-muted">{dayMonth(p.date)}</div>
                  </div>
                ))}
              </div>
            )}
            <ol className="flex flex-col px-5 pt-4 pb-5">
              {events.map((e, i) => {
                const Icon = KIND_ICON[e.kind]
                const future = e.date > TODAY
                return (
                  <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < events.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
                    <span
                      className={cn(
                        'relative z-10 grid size-8 shrink-0 place-items-center rounded-full border',
                        future ? 'border-dashed border-accent bg-surface text-accent-ink' : 'border-line bg-surface-2 text-ink-2',
                      )}
                    >
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-medium">
                          {e.title}
                          {future && <DataTag kind="proyectado" className="ml-2 align-middle">Próximo</DataTag>}
                        </span>
                        {e.amount != null && <span className="num shrink-0 text-[13.5px] font-medium">{ars(e.amount)}</span>}
                      </div>
                      <div className="text-[12.5px] text-muted">
                        {dayMonth(e.date)}
                        {e.by && ` · ${e.by}`}
                        {e.detail && ` · ${e.detail}`}
                      </div>
                      {e.kind === 'foto' && <Photo tone={e.photoTone} className="mt-2 h-28 w-full max-w-xs rounded-xl" />}
                    </div>
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* Productos */}
          {c.topProducts.length > 0 && (
            <Card>
              <CardHeader title="Qué compra" sub="Mix de 12 meses" />
              <div className="flex flex-col gap-3 px-5 pt-3 pb-4">
                {c.topProducts.map((tp) => (
                  <div key={tp.productId} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[13px]">
                      <span>{product(tp.productId).name}</span>
                      <span className="num font-medium">{tp.share} %</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-3">
                      <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${tp.share}%` }} />
                    </div>
                  </div>
                ))}
                {c.neverBought && c.neverBought.length > 0 && (
                  <div className="mt-1 rounded-xl bg-accent-soft px-3 py-2.5 text-[13px] text-accent-ink">
                    <span className="font-semibold">Oportunidad:</span> nunca compró {c.neverBought.map((p) => product(p).name.replace('Sauver ', '')).join(', ')}.
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Datos comerciales */}
          <Card>
            <CardHeader title="Datos comerciales" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 px-5 pt-3 pb-4 text-[13px]">
              <dt className="text-muted">Responsable</dt>
              <dd>{c.owner}</dd>
              <dt className="text-muted">Zona</dt>
              <dd>{c.zone}</dd>
              <dt className="text-muted">Lista</dt>
              <dd>{c.priceList}</dd>
              <dt className="text-muted">Condición</dt>
              <dd>{c.paymentTerm}</dd>
              {c.creditLimit && !seller && (
                <>
                  <dt className="text-muted">Límite de crédito</dt>
                  <dd className="num">{ars(c.creditLimit)}</dd>
                </>
              )}
              {c.firstPurchase && (
                <>
                  <dt className="text-muted">Cliente desde</dt>
                  <dd>{c.firstPurchase}</dd>
                </>
              )}
              {c.nextCollection && (
                <>
                  <dt className="text-muted">Próximo cobro</dt>
                  <dd className="num">
                    {dayMonth(c.nextCollection.date)} · {ars(c.nextCollection.amount)}
                  </dd>
                </>
              )}
              {c.cuit && !seller && (
                <>
                  <dt className="text-muted">CUIT</dt>
                  <dd className="num">{c.cuit}</dd>
                </>
              )}
              <dt className="text-muted">WhatsApp</dt>
              <dd className="num select-all">{c.whatsapp}</dd>
            </dl>
            {!seller && (
              <div className="border-t border-line px-5 py-3">
                <div className="mb-1.5 text-[12px] text-muted">Vínculos con Dux</div>
                {c.duxLinks.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {c.duxLinks.map((l) => (
                      <Badge key={l.source}>
                        {l.source} · {l.code}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge tone="warn">Prospecto sin alta en Dux</Badge>
                )}
              </div>
            )}
          </Card>

          {!seller && (
            <Button variant="secondary" size="lg" onClick={() => nav(`${role === 'gerencia' ? '/g' : '/a'}/pedidos`)}>
              <ClipboardList size={17} /> Ver pedidos del cliente
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'crit' | 'good' | 'warn' }) {
  return (
    <Card className="px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="num text-[19px] leading-tight font-semibold tracking-tight">{value}</div>
      {sub && <div className={cn('text-[12px]', tone ? `text-${tone}-ink` : 'text-muted')}>{sub}</div>}
    </Card>
  )
}
