import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMe } from '@/lib/auth'
import { orderLabel, useCustomerMap, useOrders } from '@/lib/data'
import { Segmented } from '@/components/ui/Segmented'
import { arsCompact, dayMonth } from '@/lib/format'
import { STATUS_FLOW, STATUS_LABEL } from '@/lib/types'
import { OrderSheet } from './OrderSheet'
import { cn } from '@/lib/cn'

export function MisPedidos() {
  const me = useMe()
  const orders = useOrders({ sellerId: me.id }) ?? []
  const customers = useCustomerMap()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<'curso' | 'entregados' | 'cancelados'>('curso')
  const is = (t: typeof tab, s: string) => (t === 'curso' ? s !== 'entregado' && s !== 'cancelado' : t === 'entregados' ? s === 'entregado' : s === 'cancelado')
  const list = orders.filter((o) => is(tab, o.status))
  const selected = orders.find((o) => o.id === params.get('o')) ?? null

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      <h1 className="text-[24px] font-semibold tracking-tight">Mis pedidos</h1>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'curso', label: 'En curso', count: orders.filter((o) => is('curso', o.status)).length },
          { value: 'entregados', label: 'Entregados', count: orders.filter((o) => is('entregados', o.status)).length },
          { value: 'cancelados', label: 'Cancelados', count: orders.filter((o) => is('cancelados', o.status)).length },
        ]}
      />
      <div className="flex flex-col gap-2">
        {list.map((o) => {
          const idx = STATUS_FLOW.indexOf(o.status)
          return (
            <button key={o.id} onClick={() => setParams({ o: o.id })} className={cn('flex flex-col gap-2.5 rounded-2xl border bg-surface p-3.5 text-left', o._pending ? 'border-warn' : 'border-line')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold">{customers.get(o.customer_id)?.name ?? 'Cliente'}</div>
                  <div className="text-[12.5px] text-muted">
                    {orderLabel(o)} · {dayMonth(new Date(o.created_at))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-[15px] font-semibold">{arsCompact(Number(o.total))}</div>
                  <div className={cn('text-[12.5px] font-medium', o._pending ? 'text-warn-ink' : o.status === 'listo' ? 'text-good-ink' : 'text-ink-2')}>
                    {o._pending ? 'Por enviar' : STATUS_LABEL[o.status]}
                  </div>
                </div>
              </div>
              {o.status !== 'cancelado' && (
                <div className="flex gap-[3px]">
                  {STATUS_FLOW.map((s, i) => (
                    <span key={s} className={cn('h-1 flex-1 rounded-full', i <= idx && !o._pending ? 'bg-accent' : 'bg-surface-3')} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
        {list.length === 0 && <p className="py-10 text-center text-[13.5px] text-muted">No hay pedidos acá.</p>}
      </div>
      <OrderSheet order={selected} onClose={() => setParams({})} />
    </div>
  )
}
