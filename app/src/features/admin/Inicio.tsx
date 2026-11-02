import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Check, ChevronRight, ClipboardCopy, LineChart } from 'lucide-react'
import { db } from '@/lib/db'
import { useMe } from '@/lib/auth'
import { orderLabel, useCustomerMap, useProfiles } from '@/lib/data'
import { supabase, errorText } from '@/lib/supabase'
import { syncNow } from '@/lib/sync'
import { useToast } from '@/lib/toast'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/Progress'
import { arsCompact, longDate, pct } from '@/lib/format'
import { isoDay, relativeDay, timeHM, weekStart } from '@/lib/dates'
import { STATUS_FLOW, STATUS_LABEL, UNIT_NAME, type UnitId } from '@/lib/types'
import { copyText, duxText } from '@/features/pedidos/orderText'
import { staffBase } from '@/components/shell/StaffShell'
import { cn } from '@/lib/cn'

const CHECKS = [
  { id: 'wa', label: 'WhatsApp revisado', hint: 'Grupo operativo leído' },
  { id: 'cobros', label: 'Cobros cargados en Dux', hint: 'Todos los informados' },
  { id: 'pagos', label: 'Pagos cargados en Dux', hint: 'Transferencias y efectivo' },
  { id: 'gastos', label: 'Gastos cargados en Dux', hint: 'Con comprobante' },
  { id: 'compras', label: 'Compras cargadas en Dux', hint: 'Insumos y mercadería' },
  { id: 'conciliado', label: 'Día conciliado', hint: 'Saldos coinciden con bancos' },
]

/** Inicio de Administración y Gerencia: lo operativo del día + el pulso comercial de la semana. */
export function Inicio() {
  const me = useMe()
  const nav = useNavigate()
  const toast = useToast()
  const base = staffBase(me.role)
  const customers = useCustomerMap()
  const profiles = useProfiles()
  const day = isoDay()

  const d = useLiveQuery(async () => {
    const ws = weekStart().toISOString()
    const [orders, visits, newCustomers, checks] = await Promise.all([
      db.orders.toArray(),
      db.visits.where('visited_at').aboveOrEqual(ws).toArray(),
      db.customers.where('updated_at').aboveOrEqual(ws).toArray(),
      db.daily_checks.where('day').equals(day).toArray(),
    ])
    const weekOrders = orders.filter((o) => o.created_at >= ws && o.status !== 'cancelado')
    const items = await db.order_items.where('order_id').anyOf(weekOrders.map((o) => o.id)).toArray()
    const byUnit: Record<string, number> = {}
    for (const i of items) byUnit[i.business_unit] = (byUnit[i.business_unit] ?? 0) + Number(i.subtotal)
    const bySeller = new Map<string, { visits: number; sold: number; orders: number; amount: number; created: number }>()
    const row = (id: string) => bySeller.get(id) ?? bySeller.set(id, { visits: 0, sold: 0, orders: 0, amount: 0, created: 0 }).get(id)!
    for (const v of visits) {
      const r = row(v.seller_id)
      r.visits++
      if (v.outcome === 'compro') r.sold++
    }
    for (const o of weekOrders) {
      const r = row(o.seller_id)
      r.orders++
      r.amount += Number(o.total)
    }
    for (const c of newCustomers.filter((c) => c.created_at >= ws)) row(c.owner_id).created++
    return {
      nuevos: orders.filter((o) => o.status === 'nuevo').sort((a, b) => a.created_at.localeCompare(b.created_at)),
      aprobar: orders.filter((o) => o.needs_approval && o.status !== 'cancelado'),
      counts: Object.fromEntries(STATUS_FLOW.map((s) => [s, orders.filter((o) => o.status === s).length])),
      weekTotal: weekOrders.reduce((s, o) => s + Number(o.total), 0),
      weekOrders: weekOrders.length,
      byUnit,
      visits: visits.length,
      sold: visits.filter((v) => v.outcome === 'compro').length,
      created: newCustomers.filter((c) => c.created_at >= ws).length,
      bySeller: [...bySeller.entries()],
      checks: new Map(checks.map((c) => [c.item, c.done])),
    }
  }, [day])

  if (!d) return null
  const doneChecks = CHECKS.filter((c) => d.checks.get(c.id)).length
  const toggleCheck = async (item: string) => {
    const done = !d.checks.get(item)
    await db.daily_checks.put({ day, item, done, by: me.id, updated_at: new Date().toISOString() })
    const { error } = await supabase.from('daily_checks').upsert({ day, item, done })
    if (error) toast({ title: 'No se guardó en el servidor', body: errorText(error), tone: 'error' })
    void syncNow()
  }

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div>
        <p className="text-[13px] text-muted">{longDate(new Date())}</p>
        <h2 className="mt-0.5 text-[24px] leading-tight font-semibold tracking-[-0.02em] md:text-[28px]">
          {me.role === 'gerencia' ? `Buen día, ${me.full_name || 'Joni'}` : `¿Qué hay que hacer hoy, ${me.full_name || ''}?`}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Pedidos nuevos */}
          <Card>
            <CardHeader
              title={`Pedidos nuevos${d.nuevos.length ? ` · ${d.nuevos.length}` : ''}`}
              sub="Recibirlos, cargarlos en Dux y avanzar el estado"
              action={
                <button onClick={() => nav(`${base}/pedidos`)} className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline">
                  Tablero <ChevronRight size={14} />
                </button>
              }
            />
            <div className="flex flex-col gap-2 p-3">
              {d.nuevos.length === 0 && <p className="px-2 py-4 text-[13.5px] text-muted">No hay pedidos nuevos. Cuando el vendedor envíe uno aparece acá al instante.</p>}
              {d.nuevos.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent-soft/30 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{customers.get(o.customer_id)?.name ?? 'Cliente'}</div>
                    <div className="text-[12px] text-muted">
                      {orderLabel(o)} · {profiles.get(o.seller_id)?.full_name ?? ''} · {relativeDay(new Date(o.created_at))} {timeHM(new Date(o.created_at))}
                    </div>
                  </div>
                  <span className="num text-[15px] font-semibold">{arsCompact(Number(o.total))}</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => nav(`${base}/pedidos?o=${o.id}`)}>
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const items = await db.order_items.where('order_id').equals(o.id).toArray()
                        const ok = await copyText(duxText(o, customers.get(o.customer_id), items))
                        toast({ title: ok ? 'Copiado para Dux' : 'No se pudo copiar', tone: ok ? 'good' : 'error' })
                      }}
                    >
                      <ClipboardCopy size={14} /> Copiar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
              {STATUS_FLOW.slice(1).map((s) => (
                <button key={s} onClick={() => nav(`${base}/pedidos`)} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-3 px-2.5 text-[12px] text-ink-2">
                  {STATUS_LABEL[s]} <span className="num font-semibold text-ink">{d.counts[s]}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Semana comercial */}
          <Card>
            <CardHeader title="Comercial · esta semana" sub="Pedidos tomados (todavía no es venta facturada)" />
            <div className="grid grid-cols-2 gap-3 px-5 pt-4 @3xl:grid-cols-4">
              <Kpi label="Pedidos" value={arsCompact(d.weekTotal)} sub={`${d.weekOrders} pedidos`} />
              <Kpi label="Visitas" value={String(d.visits)} sub={`${d.sold} con compra`} />
              <Kpi label="Conversión" value={d.visits ? pct((d.sold / d.visits) * 100) : '—'} sub="visitas con compra" />
              <Kpi label="Clientes nuevos" value={String(d.created)} sub="cargados esta semana" />
            </div>
            {Object.keys(d.byUnit).length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-1 px-5 pt-3 text-[13px]">
                {Object.entries(d.byUnit).map(([u, v]) => (
                  <span key={u} className="inline-flex items-center gap-1.5 text-ink-2">
                    <span className="size-2 rounded-full" style={{ background: `var(--unit-${u})` }} />
                    {UNIT_NAME[u as UnitId]} <span className="num font-medium text-ink">{arsCompact(v)}</span>
                  </span>
                ))}
              </div>
            )}
            {d.bySeller.length > 0 && (
              <div className="mt-3 overflow-x-auto border-t border-line">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11.5px] text-muted">
                      <th className="px-5 py-2 font-medium">Vendedor</th>
                      <th className="px-2 py-2 text-right font-medium">Visitas</th>
                      <th className="px-2 py-2 text-right font-medium">Pedidos</th>
                      <th className="px-2 py-2 text-right font-medium">Monto</th>
                      <th className="px-5 py-2 text-right font-medium">Nuevos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.bySeller.map(([id, r]) => (
                      <tr key={id} className="border-t border-line">
                        <td className="px-5 py-2.5 font-medium">{profiles.get(id)?.full_name ?? '—'}</td>
                        <td className="num px-2 text-right">{r.visits}</td>
                        <td className="num px-2 text-right">{r.orders}</td>
                        <td className="num px-2 text-right">{arsCompact(r.amount)}</td>
                        <td className="num px-5 text-right">{r.created}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="h-4" />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {d.aprobar.length > 0 && (
            <Card>
              <CardHeader title="Descuentos a aprobar" sub={me.role === 'gerencia' ? 'Superan el máximo autorizado' : 'Los aprueba Gerencia'} />
              <div className="flex flex-col gap-1 p-3">
                {d.aprobar.map((o) => (
                  <button key={o.id} onClick={() => nav(`${base}/pedidos?o=${o.id}`)} className="flex items-center gap-3 rounded-xl p-2.5 text-left hover:bg-surface-2">
                    <AlertTriangle size={16} className="shrink-0 text-warn-ink" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">{customers.get(o.customer_id)?.name}</span>
                      <span className="text-[12px] text-muted">
                        {orderLabel(o)} · {o.discount_pct} % · {arsCompact(Number(o.total))}
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-muted" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Control diario"
              sub="WhatsApp → carga en Dux"
              action={
                <ProgressRing value={doneChecks} max={CHECKS.length} size={44} stroke={5} tone={doneChecks === CHECKS.length ? 'good' : 'accent'}>
                  <span className="num text-[12px] font-semibold">
                    {doneChecks}/{CHECKS.length}
                  </span>
                </ProgressRing>
              }
            />
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
              {CHECKS.map((c) => {
                const on = !!d.checks.get(c.id)
                const canEdit = me.role === 'admin' || me.role === 'gerencia'
                return (
                  <button
                    key={c.id}
                    disabled={!canEdit}
                    onClick={() => void toggleCheck(c.id)}
                    className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors', on ? 'border-transparent bg-accent-soft' : 'border-line hover:border-line-strong')}
                  >
                    <span className={cn('grid size-6 shrink-0 place-items-center rounded-lg border-2', on ? 'border-accent bg-accent text-on-accent' : 'border-line-strong')}>
                      <AnimatePresence>
                        {on && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check size={14} strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-[13.5px] font-medium', on && 'text-accent-ink')}>{c.label}</span>
                      <span className="block truncate text-[11.5px] text-muted">{c.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="flex items-start gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-prov-soft text-prov">
              <LineChart size={17} />
            </span>
            <div className="text-[13px] text-ink-2">
              <div className="font-semibold text-ink">Próxima etapa: finanzas</div>
              Ventas facturadas, cobranzas, caja proyectada y punto de equilibrio llegan con la importación de reportes de Dux.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="num text-[20px] leading-tight font-semibold tracking-tight">{value}</div>
      <div className="text-[12px] text-muted">{sub}</div>
    </div>
  )
}
