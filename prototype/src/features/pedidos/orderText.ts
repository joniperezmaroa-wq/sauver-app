import type { Order } from '@/data/orders'
import { itemTotal, orderTotal, totalsByUnit } from '@/data/orders'
import { customer } from '@/data/customers'
import { product, UNITS } from '@/data/catalog'
import { ars } from '@/lib/format'

/** Texto tabulado en el orden en que se carga un presupuesto en Dux (una sección por instancia Dux). */
export function duxText(o: Order): string {
  const c = customer(o.customerId)
  const lines: string[] = [`${o.number}\t${c.name}\t${c.duxLinks[0]?.code ?? 'SIN VINCULAR'}\tCondición: ${o.paymentTerm}`]
  for (const g of totalsByUnit(o)) {
    lines.push('', `— ${UNITS[g.unit].duxSource} (${UNITS[g.unit].name}) —`)
    for (const i of g.items) {
      const p = product(i.productId)
      lines.push(`${p.id.toUpperCase()}\t${p.name} ${p.pack}\t${i.packs}\t${i.listPrice}\t${i.discountPct}%\t${itemTotal(i)}`)
    }
    lines.push(`Subtotal\t\t\t\t\t${g.total}`)
  }
  lines.push('', `TOTAL\t\t\t\t\t${orderTotal(o)} (${ars(orderTotal(o))})`)
  if (o.notes) lines.push(`Obs.: ${o.notes}`)
  return lines.join('\n')
}

export async function copyForDux(o: Order): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(duxText(o))
    return true
  } catch {
    return false
  }
}
