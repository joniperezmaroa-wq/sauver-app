// Las tres máquinas de estado del pedido, lado a lado y separadas:
// Pedido (logística, SAUVER) · Facturación (vínculo con Dux) · Cobranza (derivada de Dux).

import { BILLING_LABEL, COLLECTION_LABEL, STATUS_FLOW, STATUS_LABEL, type Order } from '@/data/orders'
import { cn } from '@/lib/cn'

export function StateRails({ order, compact = false }: { order: Order; compact?: boolean }) {
  const idx = STATUS_FLOW.indexOf(order.status)
  const billingStep = order.billing === 'facturado' ? 2 : order.billing === 'facturado_parcial' ? 1 : 0
  const collStep = { no_aplica: 0, a_vencer: 1, vence_pronto: 1, vencido: 1, parcial: 2, cobrado: 3 }[order.collection]
  const collTone = order.collection === 'vencido' ? 'bg-crit' : order.collection === 'vence_pronto' ? 'bg-warn' : 'bg-accent'

  const rails = [
    {
      label: 'Pedido',
      value: STATUS_LABEL[order.status],
      steps: STATUS_FLOW.length,
      done: order.status === 'cancelado' ? 0 : idx + 1,
      tone: order.status === 'cancelado' ? 'bg-crit' : 'bg-accent',
    },
    { label: 'Facturación', value: BILLING_LABEL[order.billing], steps: 2, done: billingStep, tone: 'bg-accent' },
    {
      label: 'Cobranza',
      value: order.collection === 'no_aplica' ? (order.billing === 'sin_facturar' ? 'Al facturar' : '—') : COLLECTION_LABEL[order.collection],
      steps: 3,
      done: collStep,
      tone: collTone,
    },
  ]

  if (compact) {
    return (
      <div className="flex gap-1.5">
        {rails.map((r) => (
          <div key={r.label} className="flex flex-1 gap-[2px]" title={`${r.label}: ${r.value}`}>
            {Array.from({ length: r.steps }).map((_, i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-full', i < r.done ? r.tone : 'bg-surface-3')} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {rails.map((r) => (
        <div key={r.label} className="flex flex-col gap-1.5">
          <span className="text-[11.5px] text-muted">{r.label}</span>
          <div className="flex gap-[3px]">
            {Array.from({ length: r.steps }).map((_, i) => (
              <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < r.done ? r.tone : 'bg-surface-3')} />
            ))}
          </div>
          <span className={cn('text-[13px] font-medium', order.collection === 'vencido' && r.label === 'Cobranza' && 'text-crit-ink')}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}
