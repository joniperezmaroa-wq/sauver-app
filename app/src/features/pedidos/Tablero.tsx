import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Segmented } from '@/components/ui/Segmented'
import { Badge } from '@/components/ui/Badge'
import { orderLabel, useCustomerMap, useOrders, useProfiles } from '@/lib/data'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { arsCompact, dayMonth } from '@/lib/format'
import { relativeDay } from '@/lib/dates'
import { STATUS_FLOW, STATUS_LABEL, type Order, type OrderStatus } from '@/lib/types'
import { OrderSheet } from './OrderSheet'
import { cn } from '@/lib/cn'

const HINT: Record<string, string> = {
  nuevo: 'Recién enviados',
  recibido: 'Falta cargar en Dux',
  cargado_dux: 'Presupuesto en Dux',
  preparando: 'En depósito',
  listo: 'Para entregar',
  entregado: 'Últimos 30 días',
}

export function Tablero() {
  const orders = useOrders() ?? []
  const customers = useCustomerMap()
  const profiles = useProfiles()
  const [params, setParams] = useSearchParams()
  const [seller, setSeller] = useState('todos')
  const [q, setQ] = useState('')
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [col, setCol] = useState<OrderStatus>('nuevo')
  const [showCancelled, setShowCancelled] = useState(false)

  const selected = orders.find((o) => o.id === params.get('o')) ?? null
  const monthAgo = Date.now() - 30 * 86_400_000
  const list = useMemo(
    () =>
      orders.filter(
        (o) =>
          (seller === 'todos' || o.seller_id === seller) &&
          (!q || (customers.get(o.customer_id)?.name ?? '').toLowerCase().includes(q.toLowerCase()) || String(o.number ?? '').includes(q)) &&
          (o.status !== 'entregado' || new Date(o.updated_at).getTime() > monthAgo),
      ),
    [orders, seller, q, customers, monthAgo],
  )
  const by = (s: OrderStatus) => list.filter((o) => o.status === s)
  const sellers = [...new Set(orders.map((o) => o.seller_id))]
  const open = (o: Order) => setParams({ o: o.id })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight">Pedidos</h2>
          <p className="text-[13.5px] text-muted">Se actualiza solo cuando el vendedor envía uno nuevo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface px-3">
            <Search size={15} className="text-muted" />
            <input id="orders-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cliente o número" className="w-36 bg-transparent text-[13.5px] outline-none placeholder:text-muted" />
          </label>
          {sellers.length > 1 && (
            <select id="seller-filter" value={seller} onChange={(e) => setSeller(e.target.value)} className="h-9 rounded-[10px] border border-line bg-surface px-3 text-[13.5px]">
              <option value="todos">Todos</option>
              {sellers.map((s) => (
                <option key={s} value={s}>
                  {profiles.get(s)?.full_name ?? 'Vendedor'}
                </option>
              ))}
            </select>
          )}
          <button onClick={() => setShowCancelled((v) => !v)} className={cn('h-9 rounded-[10px] border px-3 text-[13px]', showCancelled ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink-2')}>
            Cancelados {by('cancelado').length}
          </button>
        </div>
      </div>

      {showCancelled ? (
        <div className="grid gap-2 @3xl:grid-cols-3">
          {by('cancelado').map((o) => (
            <Card key={o.id} o={o} name={customers.get(o.customer_id)?.name} onClick={() => open(o)} />
          ))}
          {by('cancelado').length === 0 && <p className="text-[13.5px] text-muted">No hay pedidos cancelados.</p>}
        </div>
      ) : desktop ? (
        <div className="-mx-6 overflow-x-auto px-6 pb-2">
          <div className="grid min-w-[1100px] grid-cols-6 gap-3">
            {STATUS_FLOW.map((s) => (
              <div key={s} className="flex min-h-[420px] flex-col rounded-2xl bg-surface-3/60 p-2">
                <div className="px-2 pt-1.5 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold">{STATUS_LABEL[s]}</span>
                    <span className="num text-[12px] text-muted">{by(s).length}</span>
                  </div>
                  <div className="text-[11.5px] text-muted">{HINT[s]}</div>
                </div>
                <div className="flex flex-col gap-2">
                  {by(s).map((o) => (
                    <Card key={o.id} o={o} name={customers.get(o.customer_id)?.name} seller={profiles.get(o.seller_id)?.full_name} onClick={() => open(o)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <Segmented size="sm" value={col} onChange={setCol} options={STATUS_FLOW.map((s) => ({ value: s, label: STATUS_LABEL[s].replace('Cargado en Dux', 'En Dux'), count: by(s).length }))} />
          <div className="flex flex-col gap-2">
            {by(col).length === 0 && <p className="py-10 text-center text-[13.5px] text-muted">No hay pedidos en este estado.</p>}
            {by(col).map((o) => (
              <Card key={o.id} o={o} name={customers.get(o.customer_id)?.name} seller={profiles.get(o.seller_id)?.full_name} onClick={() => open(o)} />
            ))}
          </div>
        </>
      )}

      <OrderSheet order={selected} onClose={() => setParams({})} />
    </div>
  )
}

function Card({ o, name, seller, onClick }: { o: Order; name?: string; seller?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex w-full flex-col gap-2 rounded-xl border bg-surface p-3 text-left shadow-[var(--shadow-card)] hover:border-line-strong', o.status === 'nuevo' ? 'border-accent' : 'border-line')}>
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold">{name ?? 'Cliente'}</div>
        <div className="truncate text-[11.5px] text-muted">
          {orderLabel(o)}
          {seller ? ` · ${seller}` : ''} · {o.status === 'nuevo' ? relativeDay(new Date(o.created_at)) : dayMonth(new Date(o.created_at))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="num text-[16px] font-semibold tracking-tight">{arsCompact(Number(o.total))}</span>
        <span className="text-[11.5px] text-muted">{o.payment_term}</span>
      </div>
      {(o.needs_approval || o.dux_ref_sauver || o.dux_ref_joni) && (
        <div className="flex flex-wrap gap-1">
          {o.needs_approval && o.status !== 'cancelado' && <Badge tone="warn">Descuento a aprobar</Badge>}
          {o.dux_ref_sauver && <Badge>Dux {o.dux_ref_sauver}</Badge>}
          {o.dux_ref_joni && <Badge>Joni {o.dux_ref_joni}</Badge>}
        </div>
      )}
    </button>
  )
}
