import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, ArrowRight, Check, ClipboardCopy, Printer, MessageCircle } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { db } from '@/lib/db'
import { useMe } from '@/lib/auth'
import { orderLabel, useCustomer, useOrderItems, useProfiles } from '@/lib/data'
import { supabase, errorText } from '@/lib/supabase'
import { syncNow } from '@/lib/sync'
import { useToast } from '@/lib/toast'
import { ars, dayMonth } from '@/lib/format'
import { timeHM } from '@/lib/dates'
import { waLink } from '@/lib/links'
import { STATUS_FLOW, STATUS_LABEL, UNIT_DUX, UNIT_NAME, type Order, type OrderStatus } from '@/lib/types'
import { copyText, duxText, groupByUnit } from './orderText'
import { cn } from '@/lib/cn'

export function OrderSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  return (
    <Sheet open={!!order} onClose={onClose} width={580} eyebrow={order ? `${orderLabel(order)} · ${dayMonth(new Date(order.created_at))}` : ''} title={order ? <CustomerName id={order.customer_id} /> : ''}>
      {order && <Body order={order} onClose={onClose} />}
    </Sheet>
  )
}

function CustomerName({ id }: { id: string }) {
  const c = useCustomer(id)
  return <>{c?.name ?? 'Cliente'}</>
}

function Body({ order, onClose }: { order: Order; onClose: () => void }) {
  const me = useMe()
  const toast = useToast()
  const staff = me.role !== 'vendedor'
  const c = useCustomer(order.customer_id) ?? undefined
  const items = useOrderItems(order.id)
  const events = useLiveQuery(() => db.order_events.where('order_id').equals(order.id).sortBy('at'), [order.id]) ?? []
  const profiles = useProfiles()
  const [busy, setBusy] = useState(false)
  const [duxS, setDuxS] = useState('')
  const [duxJ, setDuxJ] = useState('')
  const [cancelReason, setCancelReason] = useState<string | null>(null)

  const groups = groupByUnit(items)
  const idx = STATUS_FLOW.indexOf(order.status)
  const next: OrderStatus | undefined = idx >= 0 ? STATUS_FLOW[idx + 1] : undefined
  const units = groups.map((g) => g.unit)
  const hasSauver = units.includes('sauver')
  const hasJoni = units.includes('joni') || units.includes('grower')

  const call = async (fn: () => PromiseLike<{ error: unknown }>, ok: string) => {
    setBusy(true)
    try {
      const { error } = await fn()
      if (error) throw error
      toast({ title: ok })
      await syncNow()
    } catch (e) {
      toast({ title: 'No se pudo', body: errorText(e), tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={order._pending ? 'warn' : order.status === 'cancelado' ? 'crit' : order.status === 'listo' || order.status === 'entregado' ? 'good' : 'accent'}>
            {order._pending ? 'Por enviar desde el celular' : STATUS_LABEL[order.status]}
          </Badge>
          {order.needs_approval && order.status !== 'cancelado' && (
            <Badge tone="warn" icon={<AlertTriangle size={12} />}>
              Descuento a aprobar
            </Badge>
          )}
          {staff && profiles.get(order.seller_id) && <span className="text-[12.5px] text-muted">Vendedor: {profiles.get(order.seller_id)!.full_name}</span>}
        </div>

        {/* Avance */}
        {order.status !== 'cancelado' && (
          <div className="flex gap-1">
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col gap-1">
                <span className={cn('h-1.5 rounded-full', i <= idx ? 'bg-accent' : 'bg-surface-3')} />
                <span className={cn('hidden text-[10.5px] sm:block', i === idx ? 'font-medium text-ink' : 'text-muted')}>{STATUS_LABEL[s]}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Total" value={ars(Number(order.total))} />
          <Stat label="Condición" value={order.payment_term} />
          <Stat label="Descuento" value={Number(order.discount_pct) ? `${order.discount_pct} %` : '—'} />
        </div>

        {groups.map((g) => (
          <div key={g.unit} className="overflow-hidden rounded-2xl border border-line">
            <div className="flex items-center justify-between gap-2 bg-surface-2 px-4 py-2.5">
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
                <span className="size-2 rounded-full" style={{ background: `var(--unit-${g.unit})` }} />
                {UNIT_NAME[g.unit]} <span className="font-normal text-muted">· {UNIT_DUX[g.unit]}</span>
              </span>
              <span className="text-[12px] text-muted">{(g.unit === 'sauver' ? order.dux_ref_sauver : order.dux_ref_joni) ?? 'Sin cargar en Dux'}</span>
            </div>
            {g.items.map((i) => (
              <div key={i.id} className="flex items-center gap-3 border-t border-line px-4 py-2.5">
                <span className="num grid h-7 min-w-9 place-items-center rounded-lg bg-surface-3 px-1.5 text-[13px] font-semibold">{i.packs}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">{i.product_name}</div>
                  <div className="text-[12px] text-muted">
                    {i.presentation ? `${i.presentation} · ` : ''}
                    {ars(Number(i.list_price))}
                  </div>
                </div>
                <span className="num text-[13.5px] font-medium">{ars(Number(i.subtotal))}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-line px-4 py-2.5 text-[13px]">
              <span className="text-muted">Subtotal {UNIT_NAME[g.unit]}</span>
              <span className="num font-semibold">{ars(g.total)}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-[13px] text-muted">Cargando productos…</p>}

        {order.notes && (
          <div className="rounded-xl bg-surface-2 px-4 py-3 text-[13.5px]">
            <div className="mb-0.5 text-[12px] text-muted">Observaciones</div>
            {order.notes}
          </div>
        )}

        {events.length > 0 && (
          <div>
            <div className="mb-2 text-[12px] font-medium tracking-wide text-muted uppercase">Historial</div>
            <ol className="relative flex flex-col gap-3 border-l border-line pl-4">
              {events.map((e, i) => (
                <li key={e.id} className="relative">
                  <span className={cn('absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-surface', i === events.length - 1 ? 'bg-accent' : 'bg-line-strong')} />
                  <div className="text-[13.5px]">{e.label}</div>
                  <div className="text-[12px] text-muted">
                    {dayMonth(new Date(e.at))} {timeHM(new Date(e.at))}
                    {e.by && profiles.get(e.by) ? ` · ${profiles.get(e.by)!.full_name}` : ''}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Acciones */}
      {!order._pending && (
        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-surface px-5 py-3">
          {staff && next === 'cargado_dux' && (
            <div className="grid grid-cols-2 gap-2">
              {hasSauver && <input id="dux-s" value={duxS} onChange={(e) => setDuxS(e.target.value)} placeholder="Nº Dux Sauver (opcional)" className="h-10 rounded-[10px] border border-line bg-surface px-3 text-[14px]" />}
              {hasJoni && <input id="dux-j" value={duxJ} onChange={(e) => setDuxJ(e.target.value)} placeholder="Nº Dux Joni (opcional)" className="h-10 rounded-[10px] border border-line bg-surface px-3 text-[14px]" />}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {staff && next && order.status !== 'cancelado' && (
              <Button
                variant="primary"
                disabled={busy}
                onClick={() =>
                  call(
                    () => supabase.rpc('set_order_status', { p_order_id: order.id, p_status: next, p_note: null, p_dux_sauver: duxS || null, p_dux_joni: duxJ || null }),
                    `${orderLabel(order)}: ${STATUS_LABEL[next]}`,
                  )
                }
              >
                {next === 'recibido' ? 'Marcar recibido' : next === 'cargado_dux' ? 'Marcar cargado en Dux' : `Pasar a ${STATUS_LABEL[next]}`}
                <ArrowRight size={16} />
              </Button>
            )}
            {me.role === 'gerencia' && order.needs_approval && order.status !== 'cancelado' && (
              <Button variant="soft" disabled={busy} onClick={() => call(() => supabase.rpc('approve_order', { p_order_id: order.id }), 'Descuento aprobado')}>
                <Check size={15} /> Aprobar descuento
              </Button>
            )}
            {staff && (
              <Button onClick={() => copyText(duxText(order, c, items)).then((ok) => toast({ title: ok ? 'Copiado para Dux' : 'No se pudo copiar', tone: ok ? 'good' : 'error' }))}>
                <ClipboardCopy size={15} /> Copiar para Dux
              </Button>
            )}
            <Button onClick={() => window.open(`/imprimir/${order.id}`, '_blank')}>
              <Printer size={15} /> PDF
            </Button>
            {c?.whatsapp && (
              <a href={`${waLink(c.whatsapp)}?text=${encodeURIComponent(duxText(order, c, items))}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line-strong px-4 text-sm font-medium">
                <MessageCircle size={15} /> Enviar
              </a>
            )}
            {order.status !== 'cancelado' && order.status !== 'entregado' && (staff || order.status === 'nuevo') && cancelReason === null && (
              <Button variant="ghost" className="ml-auto text-crit-ink" onClick={() => setCancelReason('')}>
                Cancelar pedido
              </Button>
            )}
          </div>
          {cancelReason !== null && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-crit-soft p-2">
              <input id="cancel-reason" autoFocus value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Motivo de la cancelación" className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-[14px]" />
              <Button size="sm" variant="ghost" onClick={() => setCancelReason(null)}>
                Volver
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={busy || !cancelReason.trim()}
                onClick={() =>
                  call(() => supabase.rpc('cancel_order', { p_order_id: order.id, p_reason: cancelReason }), 'Pedido cancelado').then(() => {
                    setCancelReason(null)
                    onClose()
                  })
                }
              >
                Confirmar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <div className="text-[11.5px] text-muted">{label}</div>
      <div className="num truncate text-[14.5px] font-semibold">{value}</div>
    </div>
  )
}
