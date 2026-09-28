import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Pencil, Search, Sparkle } from 'lucide-react'
import { Segmented } from '@/components/ui/Segmented'
import { Badge } from '@/components/ui/Badge'
import { useApp } from '@/lib/store'
import { STATUS_FLOW, STATUS_LABEL, orderTotal, totalsByUnit, type Order, type OrderStatus } from '@/data/orders'
import { customer } from '@/data/customers'
import { UNITS } from '@/data/catalog'
import { arsCompact, dayMonth } from '@/lib/format'
import { relativeDay } from '@/lib/dates'
import { OrderSheet } from './OrderSheet'
import { StateRails } from './StateRails'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/cn'

const COLUMN_HINT: Record<string, string> = {
  enviado: 'Recién enviados por el vendedor',
  recibido: 'Revisados, falta cargar en Dux',
  cargado_dux: 'Presupuesto cargado en Dux',
  preparando: 'En depósito',
  listo: 'Para entregar',
  entregado: 'Facturación y cobranza en curso',
}

export function Tablero({ canOperate }: { canOperate: boolean }) {
  const { state } = useApp()
  const [params, setParams] = useSearchParams()
  const [seller, setSeller] = useState<'todos' | 'Tomás' | 'Joni'>('todos')
  const [q, setQ] = useState('')
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [mobileCol, setMobileCol] = useState<OrderStatus>('enviado')

  const selected = state.orders.find((o) => o.id === params.get('o')) ?? null
  const orders = useMemo(
    () =>
      state.orders.filter(
        (o) =>
          o.status !== 'cancelado' &&
          (seller === 'todos' || o.seller === seller) &&
          (!q || customer(o.customerId).name.toLowerCase().includes(q.toLowerCase()) || o.number.toLowerCase().includes(q.toLowerCase())),
      ),
    [state.orders, seller, q],
  )
  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s)
  const open = (o: Order) => setParams({ o: o.id })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight">Pedidos</h2>
          <p className="text-[13.5px] text-muted">Pedido ≠ venta: la venta se confirma cuando la factura de Dux queda vinculada.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface px-3">
            <Search size={15} className="text-muted" />
            <input
              id="orders-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cliente o número"
              className="w-36 bg-transparent text-[13.5px] outline-none placeholder:text-muted"
            />
          </label>
          <Segmented
            size="sm"
            value={seller}
            onChange={setSeller}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'Tomás', label: 'Tomás' },
              { value: 'Joni', label: 'Joni' },
            ]}
          />
        </div>
      </div>

      {desktop ? (
        <div className="-mx-6 overflow-x-auto px-6 pb-2">
          <div className="grid min-w-[1180px] grid-cols-6 gap-3">
            {STATUS_FLOW.map((s) => (
              <div key={s} className="flex min-h-[420px] flex-col rounded-2xl bg-surface-3/60 p-2">
                <div className="px-2 pt-1.5 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold">{STATUS_LABEL[s]}</span>
                    <span className="num text-[12px] text-muted">{byStatus(s).length}</span>
                  </div>
                  <div className="text-[11.5px] text-muted">{COLUMN_HINT[s]}</div>
                </div>
                <div className="flex flex-col gap-2">
                  {byStatus(s).map((o) => (
                    <OrderCard key={o.id} order={o} onClick={() => open(o)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <Segmented
            size="sm"
            value={mobileCol}
            onChange={setMobileCol}
            className="-mx-1"
            options={STATUS_FLOW.map((s) => ({ value: s, label: STATUS_LABEL[s].replace('Cargado en Dux', 'En Dux'), count: byStatus(s).length }))}
          />
          <div className="flex flex-col gap-2">
            {byStatus(mobileCol).length === 0 && <p className="py-10 text-center text-[13.5px] text-muted">No hay pedidos en este estado.</p>}
            {byStatus(mobileCol).map((o) => (
              <OrderCard key={o.id} order={o} onClick={() => open(o)} />
            ))}
          </div>
        </>
      )}

      <OrderSheet order={selected} onClose={() => setParams({})} canOperate={canOperate} />
    </div>
  )
}

export function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const c = customer(order.customerId)
  const groups = totalsByUnit(order)
  return (
    <motion.button
      layout
      layoutId={order.id}
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-2.5 rounded-xl border bg-surface p-3 text-left shadow-[var(--shadow-card)] transition-colors hover:border-line-strong',
        order.isNew ? 'border-accent ring-2 ring-accent/20' : 'border-line',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold">{c.name}</div>
          <div className="text-[11.5px] text-muted">
            {order.number} · {order.seller} · {order.status === 'enviado' ? relativeDay(order.createdAt) : dayMonth(order.createdAt)}
          </div>
        </div>
        {order.isNew && (
          <Badge tone="accent" icon={<Sparkle size={11} />}>
            Nuevo
          </Badge>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="num text-[16px] font-semibold tracking-tight">{arsCompact(orderTotal(order))}</span>
        <span className="flex gap-1">
          {groups.map((g) => (
            <span key={g.unit} className="inline-flex h-5 items-center gap-1 rounded-full bg-surface-3 px-1.5 text-[10.5px] font-medium text-ink-2" title={UNITS[g.unit].name}>
              <span className="size-1.5 rounded-full" style={{ background: `var(--unit-${g.unit})` }} />
              {UNITS[g.unit].short}
            </span>
          ))}
        </span>
      </div>
      <StateRails order={order} compact />
      {(order.modifiedAfterDux || order.collection === 'vencido' || (order.status === 'entregado' && order.billing === 'sin_facturar')) && (
        <div className="flex flex-wrap gap-1">
          {order.modifiedAfterDux && (
            <Badge tone="warn" icon={<Pencil size={11} />}>
              Actualizar Dux
            </Badge>
          )}
          {order.collection === 'vencido' && <Badge tone="crit">Cobro vencido</Badge>}
          {order.status === 'entregado' && order.billing === 'sin_facturar' && <Badge tone="serious">Sin factura vinculada</Badge>}
        </div>
      )}
    </motion.button>
  )
}
