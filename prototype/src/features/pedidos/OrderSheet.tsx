import { useState } from 'react'
import { AlertTriangle, ArrowRight, ClipboardCopy, FileText, Pencil, X } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useApp } from '@/lib/store'
import {
  BILLING_LABEL,
  COLLECTION_LABEL,
  STATUS_FLOW,
  STATUS_LABEL,
  itemTotal,
  orderTotal,
  totalsByUnit,
  type Order,
  type OrderStatus,
} from '@/data/orders'
import { customer } from '@/data/customers'
import { product, UNITS } from '@/data/catalog'
import { ars, dayMonth, int } from '@/lib/format'
import { copyForDux } from './orderText'
import { OrderPdf } from './OrderPdf'
import { StateRails } from './StateRails'
import { cn } from '@/lib/cn'

export function OrderSheet({ order, onClose, canOperate }: { order: Order | null; onClose: () => void; canOperate: boolean }) {
  const { dispatch, toast } = useApp()
  const [pdf, setPdf] = useState(false)
  const [duxNum, setDuxNum] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  if (!order) return <Sheet open={false} onClose={onClose}>{null}</Sheet>

  const c = customer(order.customerId)
  const idx = STATUS_FLOW.indexOf(order.status)
  const next: OrderStatus | undefined = idx >= 0 ? STATUS_FLOW[idx + 1] : undefined
  const groups = totalsByUnit(order)
  const units = order.items.reduce((s, i) => s + i.packs * product(i.productId).unitsPerPack, 0)

  const advance = () => {
    if (!next) return
    dispatch({ type: 'order/advance', id: order.id, to: next, by: 'Carla', duxRef: next === 'cargado_dux' && duxNum ? duxNum : undefined })
    toast({ title: `${order.number}: ${STATUS_LABEL[next]}`, body: next === 'listo' ? 'Tomás recibe el aviso en el celular.' : undefined })
    setDuxNum('')
  }

  return (
    <>
      <Sheet
        open={!!order}
        onClose={() => {
          setConfirmCancel(false)
          onClose()
        }}
        width={580}
        eyebrow={`${order.number} · ${dayMonth(order.createdAt)} · ${order.seller}`}
        title={c.name}
        footer={
          canOperate && order.status !== 'cancelado' ? (
            <div className="flex flex-col gap-2">
              {next === 'cargado_dux' && (
                <input
                  id="dux-ref"
                  value={duxNum}
                  onChange={(e) => setDuxNum(e.target.value)}
                  placeholder="Nº de presupuesto o pedido en Dux (opcional)"
                  className="h-10 rounded-[10px] border border-line bg-surface px-3 text-[14px] outline-none focus:border-accent"
                />
              )}
              <div className="flex flex-wrap items-center gap-2">
                {next && (
                  <Button variant="primary" onClick={advance} className="flex-1 sm:flex-none">
                    {next === 'recibido' ? 'Marcar recibido' : next === 'cargado_dux' ? 'Marcar cargado en Dux' : `Pasar a ${STATUS_LABEL[next]}`}
                    <ArrowRight size={16} />
                  </Button>
                )}
                <Button
                  onClick={() => copyForDux(order).then((ok) => toast({ title: ok ? 'Copiado para Dux' : 'No se pudo copiar', body: ok ? 'Una sección por cada instancia de Dux.' : 'Tu navegador bloqueó el portapapeles.' }))}
                >
                  <ClipboardCopy size={15} /> Copiar para Dux
                </Button>
                <Button onClick={() => setPdf(true)}>
                  <FileText size={15} /> PDF
                </Button>
                {idx >= 0 && order.status !== 'entregado' && (
                  <Button variant="ghost" className="ml-auto text-crit-ink" onClick={() => setConfirmCancel(true)}>
                    Cancelar
                  </Button>
                )}
              </div>
              {confirmCancel && (
                <div className="flex items-center gap-2 rounded-xl bg-crit-soft px-3 py-2 text-[13px]">
                  <span className="flex-1 text-crit-ink">¿Cancelar {order.number}? Queda registrado con el motivo.</span>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>
                    No
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      dispatch({ type: 'order/cancel', id: order.id, by: 'Carla' })
                      setConfirmCancel(false)
                      toast({ title: `${order.number} cancelado` })
                    }}
                  >
                    Sí, cancelar
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setPdf(true)}>
                <FileText size={15} /> Ver PDF
              </Button>
            </div>
          )
        }
      >
        <div className="flex flex-col gap-5 p-5">
          <StateRails order={order} />

          {order.modifiedAfterDux && (
            <div className="flex items-start gap-2.5 rounded-xl bg-warn-soft px-3.5 py-3 text-[13px] text-ink-2">
              <Pencil size={15} className="mt-0.5 shrink-0 text-warn-ink" />
              <span>
                <span className="font-medium text-ink">Modificado después de cargarlo en Dux.</span> Hay que actualizar el presupuesto {order.duxRefs.sauver} en Dux.
              </span>
            </div>
          )}
          {order.needsApproval && order.status === 'enviado' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-info-soft px-3.5 py-3 text-[13px] text-ink-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-info-ink" />
              {order.needsApproval}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Total comercial" value={ars(orderTotal(order))} />
            <Stat label="Unidades" value={int(units)} />
            <Stat label="Condición" value={order.paymentTerm} />
          </div>

          {groups.map((g) => (
            <div key={g.unit} className="overflow-hidden rounded-2xl border border-line">
              <div className="flex items-center justify-between gap-2 bg-surface-2 px-4 py-2.5">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
                  <span className="size-2 rounded-full" style={{ background: `var(--unit-${g.unit})` }} />
                  {UNITS[g.unit].name}
                  <span className="font-normal text-muted">· {UNITS[g.unit].duxSource}</span>
                </span>
                <span className="text-[12px] text-muted">{order.duxRefs[g.unit] ?? 'Sin cargar en Dux'}</span>
              </div>
              {g.items.map((i) => {
                const p = product(i.productId)
                return (
                  <div key={i.productId} className="flex items-center gap-3 border-t border-line px-4 py-2.5">
                    <span className="num grid h-7 min-w-9 place-items-center rounded-lg bg-surface-3 px-1.5 text-[13px] font-semibold">{i.packs}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">{p.name}</div>
                      <div className="text-[12px] text-muted">
                        {p.pack} · {ars(i.listPrice)}
                        {i.discountPct > 0 && ` · −${i.discountPct} %`}
                      </div>
                    </div>
                    <span className="num text-[13.5px] font-medium">{ars(itemTotal(i))}</span>
                  </div>
                )
              })}
              <div className="flex justify-between border-t border-line px-4 py-2.5 text-[13px]">
                <span className="text-muted">Subtotal {UNITS[g.unit].name}</span>
                <span className="num font-semibold">{ars(g.total)}</span>
              </div>
            </div>
          ))}

          {groups.length > 1 && (
            <p className="-mt-2 text-[12.5px] text-muted">
              Impacto en Sauver: <span className="num font-medium text-ink">{ars(groups.find((g) => g.unit === 'sauver')?.total ?? 0)}</span>. El resto se
              carga en su propia instancia de Dux y no entra en ventas, caja ni rentabilidad de Sauver.
            </p>
          )}

          {order.notes && (
            <div className="rounded-xl bg-surface-2 px-4 py-3 text-[13.5px]">
              <div className="mb-0.5 text-[12px] text-muted">Observaciones</div>
              {order.notes}
            </div>
          )}

          <div>
            <div className="mb-2 text-[12px] font-medium tracking-wide text-muted uppercase">Historial</div>
            <ol className="relative flex flex-col gap-3 border-l border-line pl-4">
              {order.events.map((e, i) => (
                <li key={i} className="relative">
                  <span className={cn('absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-surface', i === order.events.length - 1 ? 'bg-accent' : 'bg-line-strong')} />
                  <div className="text-[13.5px]">{e.label}</div>
                  <div className="text-[12px] text-muted">
                    {dayMonth(e.at)} {e.at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {e.by}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap gap-2 text-[12px]">
            <Badge>Facturación: {BILLING_LABEL[order.billing]}</Badge>
            {order.collection !== 'no_aplica' && <Badge>Cobranza: {COLLECTION_LABEL[order.collection]}</Badge>}
          </div>
        </div>
      </Sheet>
      <PdfPreview order={pdf ? order : null} onClose={() => setPdf(false)} />
    </>
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

function PdfPreview({ order, onClose }: { order: Order | null; onClose: () => void }) {
  return (
    <Sheet open={!!order} onClose={onClose} width={720} title="Vista del PDF" eyebrow="La información oficial queda en SAUVER; el PDF es una salida">
      <div className="bg-surface-3 p-4 md:p-6">{order && <OrderPdf order={order} />}</div>
      <div className="flex items-center gap-2 px-5 py-3 text-[12.5px] text-muted">
        <X size={14} /> En el prototipo no se descarga el archivo. En producción: descargar, imprimir o enviar por WhatsApp.
      </div>
    </Sheet>
  )
}
