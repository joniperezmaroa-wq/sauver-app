import { ars, ddmm } from '@/lib/format'
import { UNIT_DUX, UNIT_NAME, type Customer, type Order, type OrderItem, type UnitId } from '@/lib/types'

export function groupByUnit(items: OrderItem[]) {
  const units: UnitId[] = ['sauver', 'joni', 'grower']
  return units
    .map((u) => {
      const its = items.filter((i) => i.business_unit === u)
      return { unit: u, items: its, total: its.reduce((s, i) => s + Number(i.subtotal), 0) }
    })
    .filter((g) => g.items.length)
}

/** Texto para copiar y cargar el presupuesto en Dux: una sección por cada instancia de Dux. */
export function duxText(o: Order, c: Customer | undefined, items: OrderItem[]): string {
  const lines = [
    `Pedido ${o.number ? `P-${o.number}` : ''} · ${ddmm(new Date(o.created_at))}`,
    `Cliente: ${c?.name ?? ''}${c?.cuit ? ` · CUIT ${c.cuit}` : ''}`,
    `Condición: ${o.payment_term}${Number(o.discount_pct) ? ` · Descuento ${o.discount_pct}%` : ''}`,
  ]
  for (const g of groupByUnit(items)) {
    lines.push('', `— ${UNIT_DUX[g.unit]} (${UNIT_NAME[g.unit]}) —`)
    for (const i of g.items) {
      lines.push(`${i.packs}\t${i.product_name}${i.presentation ? ` (${i.presentation})` : ''}\t${ars(Number(i.list_price))}\t${ars(Number(i.subtotal))}`)
    }
    lines.push(`Subtotal ${UNIT_NAME[g.unit]}: ${ars(g.total)}`)
  }
  lines.push('', `TOTAL: ${ars(Number(o.total))}`)
  if (o.notes) lines.push(`Obs.: ${o.notes}`)
  return lines.join('\n')
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
