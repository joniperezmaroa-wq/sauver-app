import { useState } from 'react'
import { useApp } from '@/lib/store'
import { customer } from '@/data/customers'
import { orderTotal, STATUS_LABEL, type Order } from '@/data/orders'
import { Segmented } from '@/components/ui/Segmented'
import { StateRails } from '@/features/pedidos/StateRails'
import { OrderSheet } from '@/features/pedidos/OrderSheet'
import { arsCompact, dayMonth } from '@/lib/format'
import { cn } from '@/lib/cn'

export function VendedorPedidos() {
  const { state } = useApp()
  const [tab, setTab] = useState<'curso' | 'entregados'>('curso')
  const [sel, setSel] = useState<Order | null>(null)
  const mine = state.orders.filter((o) => o.seller === 'Tomás' && o.status !== 'cancelado')
  const list = mine.filter((o) => (tab === 'curso' ? o.status !== 'entregado' : o.status === 'entregado'))
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      <h1 className="text-[24px] font-semibold tracking-tight">Mis pedidos</h1>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'curso', label: 'En curso', count: mine.filter((o) => o.status !== 'entregado').length },
          { value: 'entregados', label: 'Entregados', count: mine.filter((o) => o.status === 'entregado').length },
        ]}
      />
      <div className="flex flex-col gap-2">
        {list.map((o) => (
          <button key={o.id} onClick={() => setSel(o)} className={cn('flex flex-col gap-2.5 rounded-2xl border bg-surface p-3.5 text-left', o.isNew ? 'border-accent' : 'border-line')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">{customer(o.customerId).name}</div>
                <div className="text-[12.5px] text-muted">
                  {o.number} · {dayMonth(o.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="num text-[15px] font-semibold">{arsCompact(orderTotal(o))}</div>
                <div className={cn('text-[12.5px] font-medium', o.status === 'listo' ? 'text-good-ink' : 'text-ink-2')}>{STATUS_LABEL[o.status]}</div>
              </div>
            </div>
            <StateRails order={o} compact />
          </button>
        ))}
        {list.length === 0 && <p className="py-10 text-center text-[13.5px] text-muted">No hay pedidos acá.</p>}
      </div>
      <OrderSheet order={sel} onClose={() => setSel(null)} canOperate={false} />
    </div>
  )
}
