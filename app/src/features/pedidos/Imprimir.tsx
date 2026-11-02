import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { orderLabel, useCustomer, useOrderItems, useProfiles } from '@/lib/data'
import { ars } from '@/lib/format'
import { UNIT_NAME } from '@/lib/types'
import { groupByUnit } from './orderText'

/** Pedido listo para imprimir o "Guardar como PDF" desde el navegador. Siempre en papel claro. */
export function Imprimir() {
  const { id = '' } = useParams()
  const order = useLiveQuery(() => db.orders.get(id), [id])
  const c = useCustomer(order?.customer_id)
  const items = useOrderItems(order?.id)
  const profiles = useProfiles()
  const ready = !!order && !!c && items.length > 0

  useEffect(() => {
    if (ready) {
      document.title = `Pedido ${orderLabel(order!)} · ${c!.name}`
      const t = window.setTimeout(() => window.print(), 400)
      return () => window.clearTimeout(t)
    }
  }, [ready, order, c])

  if (!order || !c) return <p className="p-8 text-[14px]">Cargando pedido…</p>
  const groups = groupByUnit(items)

  return (
    <div className="min-h-full bg-[#e9ecea] py-6 print:bg-white print:py-0" style={{ colorScheme: 'light' }}>
      <div className="mx-auto w-full max-w-[720px] bg-white p-8 text-[12.5px] text-[#16201b] shadow print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-[#e3e8e5] pb-5">
          <div className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 26 26" aria-hidden>
              <rect width="26" height="26" rx="7.5" fill="#0f7a5c" />
              <path d="M17.2 8.6c-.9-1-2.3-1.6-4-1.6-2.5 0-4.2 1.3-4.2 3.2 0 4.2 8.4 2.5 8.4 6.3 0 1.9-1.8 3.2-4.3 3.2-1.8 0-3.3-.7-4.2-1.8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <div>
              <div className="text-[16px] font-semibold tracking-[0.16em]">SAUVER</div>
              <div className="text-[10.5px] text-[#6b7771]">Pedido comercial · no válido como factura</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[20px] font-semibold">{orderLabel(order)}</div>
            <div className="text-[#6b7771]">{new Date(order.created_at).toLocaleDateString('es-AR')}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 py-5">
          <div>
            <div className="mb-1 text-[10px] font-medium tracking-wider text-[#6b7771] uppercase">Cliente</div>
            <div className="text-[14px] font-semibold">{c.name}</div>
            {c.legal_name && <div>{c.legal_name}</div>}
            {c.cuit && <div>CUIT {c.cuit}</div>}
            <div className="text-[#6b7771]">{[c.address, c.zone].filter(Boolean).join(' · ')}</div>
            {c.whatsapp && <div className="text-[#6b7771]">{c.whatsapp}</div>}
          </div>
          <div>
            <div className="mb-1 text-[10px] font-medium tracking-wider text-[#6b7771] uppercase">Condiciones</div>
            <div>Vendedor: {profiles.get(order.seller_id)?.full_name ?? ''}</div>
            <div>Condición de pago: {order.payment_term}</div>
            <div>Depósito: {order.warehouse}</div>
            {Number(order.discount_pct) > 0 && <div>Descuento: {order.discount_pct} %</div>}
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-[#e3e8e5] text-left text-[10px] tracking-wider text-[#6b7771] uppercase">
              <th className="py-2 font-medium">Producto</th>
              <th className="py-2 text-right font-medium">Cant.</th>
              <th className="py-2 text-right font-medium">Precio</th>
              <th className="py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Rows key={g.unit} name={UNIT_NAME[g.unit]} multi={groups.length > 1} total={g.total} items={g.items} />
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <div className="w-60">
            <div className="flex justify-between border-t-2 border-[#16201b] pt-2 text-[16px] font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{ars(Number(order.total))}</span>
            </div>
          </div>
        </div>
        {order.notes && (
          <div className="mt-5 rounded bg-[#f3f5f4] px-3 py-2">
            <span className="font-medium">Observaciones: </span>
            {order.notes}
          </div>
        )}
        <div className="mt-8 border-t border-[#e3e8e5] pt-3 text-[10px] text-[#6b7771]">Generado por SAUVER App · {new Date().toLocaleString('es-AR')}</div>
        <button onClick={() => window.print()} className="mt-6 rounded-lg bg-[#0f7a5c] px-4 py-2 text-[13px] font-medium text-white print:hidden">
          Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  )
}

function Rows({ name, multi, total, items }: { name: string; multi: boolean; total: number; items: ReturnType<typeof groupByUnit>[number]['items'] }) {
  return (
    <>
      {multi && (
        <tr>
          <td colSpan={4} className="pt-3 pb-1 text-[10.5px] font-semibold tracking-wider uppercase">
            {name}
          </td>
        </tr>
      )}
      {items.map((i) => (
        <tr key={i.id} className="border-b border-[#eef1ef]">
          <td className="py-2">
            {i.product_name}
            {i.presentation && <span className="text-[#6b7771]"> · {i.presentation}</span>}
          </td>
          <td className="py-2 text-right tabular-nums">{i.packs}</td>
          <td className="py-2 text-right tabular-nums">{ars(Number(i.list_price))}</td>
          <td className="py-2 text-right tabular-nums">{ars(Number(i.subtotal))}</td>
        </tr>
      ))}
      {multi && (
        <tr>
          <td colSpan={3} className="py-1.5 text-right text-[#6b7771]">
            Subtotal {name}
          </td>
          <td className="py-1.5 text-right font-medium tabular-nums">{ars(total)}</td>
        </tr>
      )}
    </>
  )
}
