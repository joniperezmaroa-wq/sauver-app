// Maqueta del PDF del pedido. Siempre en papel claro, independiente del tema de la app.

import type { Order } from '@/data/orders'
import { itemTotal, orderTotal, totalsByUnit } from '@/data/orders'
import { customer } from '@/data/customers'
import { product, UNITS } from '@/data/catalog'
import { ars, ddmm } from '@/lib/format'

export function OrderPdf({ order }: { order: Order }) {
  const c = customer(order.customerId)
  const groups = totalsByUnit(order)
  return (
    <div
      className="mx-auto w-full max-w-[620px] rounded-sm bg-white p-6 text-[12px] text-[#16201b] shadow-[0_2px_12px_rgb(0_0_0/0.12)] md:p-9"
      style={{ colorScheme: 'light' }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#e3e8e5] pb-5">
        <div className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 26 26" aria-hidden>
            <rect width="26" height="26" rx="7.5" fill="#0f7a5c" />
            <path d="M17.2 8.6c-.9-1-2.3-1.6-4-1.6-2.5 0-4.2 1.3-4.2 3.2 0 4.2 8.4 2.5 8.4 6.3 0 1.9-1.8 3.2-4.3 3.2-1.8 0-3.3-.7-4.2-1.8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <div>
            <div className="text-[15px] font-semibold tracking-[0.16em]">SAUVER</div>
            <div className="text-[10.5px] text-[#6b7771]">Pedido comercial · no válido como factura</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[18px] font-semibold">{order.number}</div>
          <div className="text-[#6b7771]">{ddmm(order.createdAt)}/2026</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-5">
        <div>
          <div className="mb-1 text-[10px] font-medium tracking-wider text-[#6b7771] uppercase">Cliente</div>
          <div className="text-[13px] font-semibold">{c.name}</div>
          {c.legalName && <div>{c.legalName}</div>}
          {c.cuit && <div>CUIT {c.cuit}</div>}
          <div className="text-[#6b7771]">{c.address}</div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-medium tracking-wider text-[#6b7771] uppercase">Condiciones</div>
          <div>Vendedor: {order.seller}</div>
          <div>Condición de pago: {order.paymentTerm}</div>
          <div>Lista: {c.priceList}</div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-[#e3e8e5] text-left text-[10px] tracking-wider text-[#6b7771] uppercase">
            <th className="py-2 font-medium">Producto</th>
            <th className="py-2 text-right font-medium">Cant.</th>
            <th className="py-2 text-right font-medium">Precio</th>
            <th className="py-2 text-right font-medium">Desc.</th>
            <th className="py-2 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <GroupRows key={g.unit} unit={g.unit} total={g.total} items={g.items} multi={groups.length > 1} />
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-56">
          <div className="flex justify-between border-t-2 border-[#16201b] pt-2 text-[15px] font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{ars(orderTotal(order))}</span>
          </div>
          <div className="mt-1 text-right text-[10.5px] text-[#6b7771]">Precios sin IVA</div>
        </div>
      </div>

      {order.notes && (
        <div className="mt-5 rounded bg-[#f3f5f4] px-3 py-2">
          <span className="font-medium">Observaciones: </span>
          {order.notes}
        </div>
      )}
      <div className="mt-8 border-t border-[#e3e8e5] pt-3 text-[10px] text-[#6b7771]">
        Generado por SAUVER App · {ddmm(new Date(2026, 8, 28))}/2026 · versión 1 del pedido
      </div>
    </div>
  )

  function GroupRows({ unit, items, total, multi }: { unit: keyof typeof UNITS; items: Order['items']; total: number; multi: boolean }) {
    return (
      <>
        {multi && (
          <tr>
            <td colSpan={5} className="pt-3 pb-1 text-[10.5px] font-semibold tracking-wider uppercase">
              {UNITS[unit].name}
            </td>
          </tr>
        )}
        {items.map((i) => {
          const p = product(i.productId)
          return (
            <tr key={i.productId} className="border-b border-[#eef1ef]">
              <td className="py-2">
                {p.name}
                <span className="text-[#6b7771]"> · {p.pack}</span>
              </td>
              <td className="py-2 text-right tabular-nums">{i.packs}</td>
              <td className="py-2 text-right tabular-nums">{ars(i.listPrice)}</td>
              <td className="py-2 text-right tabular-nums">{i.discountPct ? `${i.discountPct} %` : '—'}</td>
              <td className="py-2 text-right tabular-nums">{ars(itemTotal(i))}</td>
            </tr>
          )
        })}
        {multi && (
          <tr>
            <td colSpan={4} className="py-1.5 text-right text-[#6b7771]">
              Subtotal {UNITS[unit].name}
            </td>
            <td className="py-1.5 text-right font-medium tabular-nums">{ars(total)}</td>
          </tr>
        )}
      </>
    )
  }
}
