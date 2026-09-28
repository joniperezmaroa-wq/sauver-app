// DATOS FICTICIOS — pedidos de ejemplo. Muestran las tres máquinas de estado separadas:
// estado del pedido (logística), facturación (vínculo con Dux) y cobranza (derivada de Dux).

import { TODAY, addDays } from '@/lib/dates'
import type { UnitId } from './catalog'
import { product } from './catalog'

export type OrderStatus =
  | 'enviado'
  | 'recibido'
  | 'cargado_dux'
  | 'preparando'
  | 'listo'
  | 'entregado'
  | 'cancelado'

export type BillingStatus = 'sin_facturar' | 'facturado_parcial' | 'facturado'
export type CollectionStatus = 'no_aplica' | 'a_vencer' | 'vence_pronto' | 'vencido' | 'parcial' | 'cobrado'

export const STATUS_FLOW: OrderStatus[] = ['enviado', 'recibido', 'cargado_dux', 'preparando', 'listo', 'entregado']

export const STATUS_LABEL: Record<OrderStatus, string> = {
  enviado: 'Nuevo',
  recibido: 'Recibido',
  cargado_dux: 'Cargado en Dux',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const BILLING_LABEL: Record<BillingStatus, string> = {
  sin_facturar: 'Sin facturar',
  facturado_parcial: 'Facturado parcial',
  facturado: 'Facturado',
}

export const COLLECTION_LABEL: Record<CollectionStatus, string> = {
  no_aplica: '—',
  a_vencer: 'A vencer',
  vence_pronto: 'Vence pronto',
  vencido: 'Vencido',
  parcial: 'Cobro parcial',
  cobrado: 'Cobrado',
}

export interface OrderItem {
  productId: string
  packs: number
  listPrice: number
  discountPct: number
}

export interface OrderEvent {
  at: Date
  label: string
  by: string
}

export interface Order {
  id: string
  number: string
  customerId: string
  seller: string
  createdAt: Date
  status: OrderStatus
  billing: BillingStatus
  collection: CollectionStatus
  paymentTerm: string
  expectedCollection?: Date
  items: OrderItem[]
  notes?: string
  duxRefs: Partial<Record<UnitId, string>>
  invoiceRefs?: Partial<Record<UnitId, string>>
  modifiedAfterDux?: boolean
  needsApproval?: string
  events: OrderEvent[]
  /** Creado en esta sesión del prototipo */
  isNew?: boolean
}

export function itemTotal(i: OrderItem): number {
  return Math.round(i.packs * i.listPrice * (1 - i.discountPct / 100))
}

export function orderTotal(o: Order): number {
  return o.items.reduce((s, i) => s + itemTotal(i), 0)
}

export function totalsByUnit(o: Order): { unit: UnitId; total: number; items: OrderItem[] }[] {
  const map = new Map<UnitId, OrderItem[]>()
  for (const i of o.items) {
    const u = product(i.productId).unit
    map.set(u, [...(map.get(u) ?? []), i])
  }
  return [...map.entries()].map(([unit, items]) => ({
    unit,
    items,
    total: items.reduce((s, i) => s + itemTotal(i), 0),
  }))
}

const it = (productId: string, packs: number, discountPct = 0): OrderItem => ({
  productId,
  packs,
  listPrice: product(productId).price,
  discountPct,
})

const h = (daysAgo: number, hour: number, min = 0) => {
  const d = addDays(TODAY, -daysAgo)
  d.setHours(hour, min)
  return d
}

export const ORDERS: Order[] = [
  {
    id: 'o-1046', number: 'P-1046', customerId: 'c-candy', seller: 'Tomás', createdAt: h(0, 10, 12),
    status: 'enviado', billing: 'sin_facturar', collection: 'no_aplica', paymentTerm: 'Contado',
    items: [it('sv-reg', 3), it('sv-ks', 2), it('jn-pap', 2), it('jn-grind', 2)],
    notes: 'Entregar antes del jueves. Pidió probar Slim en la próxima.', duxRefs: {},
    events: [{ at: h(0, 10, 12), label: 'Pedido enviado desde el celular', by: 'Tomás' }],
  },
  {
    id: 'o-1045', number: 'P-1045', customerId: 'c-24', seller: 'Tomás', createdAt: h(0, 9, 40),
    status: 'enviado', billing: 'sin_facturar', collection: 'no_aplica', paymentTerm: '7 días',
    items: [it('sv-reg', 4, 5), it('sv-ks', 2, 5)], duxRefs: {},
    needsApproval: 'Descuento 5 % sobre lista Kiosco (dentro del rango autorizado)',
    events: [{ at: h(0, 9, 40), label: 'Pedido enviado desde el celular', by: 'Tomás' }],
  },
  {
    id: 'o-1044', number: 'P-1044', customerId: 'c-norte', seller: 'Joni', createdAt: h(1, 17, 5),
    status: 'recibido', billing: 'sin_facturar', collection: 'no_aplica', paymentTerm: '30 días',
    items: [it('sv-reg', 40, 8), it('sv-ks', 25, 8), it('sv-slim', 10, 8), it('jn-pap', 12)], duxRefs: {},
    events: [
      { at: h(1, 17, 5), label: 'Pedido creado', by: 'Joni' },
      { at: h(0, 8, 50), label: 'Recibido por Administración', by: 'Carla' },
    ],
  },
  {
    id: 'o-1043', number: 'P-1043', customerId: 'c-rivas', seller: 'Tomás', createdAt: h(1, 12, 30),
    status: 'cargado_dux', billing: 'sin_facturar', collection: 'no_aplica', paymentTerm: '15 días',
    items: [it('sv-ks', 4), it('sv-slim', 3), it('jn-tips', 2)], duxRefs: { sauver: 'PED-004417', joni: 'PJ-000981' },
    events: [
      { at: h(1, 12, 30), label: 'Pedido enviado desde el celular', by: 'Tomás' },
      { at: h(1, 14, 10), label: 'Recibido por Administración', by: 'Carla' },
      { at: h(1, 15, 2), label: 'Cargado en Dux Sauver (PED-004417) y Dux Joni (PJ-000981)', by: 'Carla' },
    ],
  },
  {
    id: 'o-1042', number: 'P-1042', customerId: 'c-oeste', seller: 'Joni', createdAt: h(2, 11, 0),
    status: 'preparando', billing: 'sin_facturar', collection: 'no_aplica', paymentTerm: '15 días',
    items: [it('sv-reg', 18, 6), it('sv-mini', 10, 6), it('sv-ks', 8, 6)], duxRefs: { sauver: 'PED-004411' },
    modifiedAfterDux: true, notes: 'El cliente sumó 2 cajas de Mini por WhatsApp.',
    events: [
      { at: h(2, 11, 0), label: 'Pedido creado', by: 'Joni' },
      { at: h(2, 11, 40), label: 'Cargado en Dux Sauver (PED-004411)', by: 'Carla' },
      { at: h(1, 9, 15), label: 'Modificado: +2 Sauver Mini. Falta actualizar Dux', by: 'Carla' },
      { at: h(1, 9, 20), label: 'En preparación (La Plata)', by: 'Carla' },
    ],
  },
  {
    id: 'o-1041', number: 'P-1041', customerId: 'c-pulperia', seller: 'Tomás', createdAt: h(3, 16, 20),
    status: 'listo', billing: 'sin_facturar', collection: 'no_aplica', paymentTerm: 'Contado',
    items: [it('sv-reg', 3), it('sv-mini', 1)], duxRefs: { sauver: 'PED-004406' },
    events: [
      { at: h(3, 16, 20), label: 'Pedido enviado desde el celular', by: 'Tomás' },
      { at: h(3, 17, 0), label: 'Cargado en Dux Sauver (PED-004406)', by: 'Carla' },
      { at: h(1, 11, 0), label: 'Listo para entregar', by: 'Carla' },
    ],
  },
  {
    id: 'o-1040', number: 'P-1040', customerId: 'c-lumen', seller: 'Joni', createdAt: h(4, 10, 0),
    status: 'listo', billing: 'facturado', collection: 'a_vencer', paymentTerm: '30 días',
    expectedCollection: addDays(TODAY, 26), items: [it('sv-reg', 24, 8), it('sv-ks', 10, 8)],
    duxRefs: { sauver: 'PED-004399' }, invoiceRefs: { sauver: 'FA 0003-00018871' },
    events: [
      { at: h(4, 10, 0), label: 'Pedido creado', by: 'Joni' },
      { at: h(4, 12, 0), label: 'Cargado en Dux Sauver (PED-004399)', by: 'Carla' },
      { at: h(2, 10, 0), label: 'Factura vinculada desde import Dux', by: 'Sistema' },
      { at: h(1, 16, 0), label: 'Listo para entregar', by: 'Carla' },
    ],
  },
  {
    id: 'o-1038', number: 'P-1038', customerId: 'c-verde', seller: 'Tomás', createdAt: h(8, 11, 30),
    status: 'entregado', billing: 'sin_facturar', collection: 'no_aplica', paymentTerm: '15 días',
    items: [it('sv-slim', 4), it('sv-ks', 3), it('gt-sust', 4)], duxRefs: { sauver: 'PED-004371', grower: 'PJ-000962' },
    events: [
      { at: h(8, 11, 30), label: 'Pedido enviado desde el celular', by: 'Tomás' },
      { at: h(8, 13, 0), label: 'Cargado en Dux', by: 'Carla' },
      { at: h(5, 10, 30), label: 'Entregado', by: 'Ramón' },
    ],
  },
  {
    id: 'o-1036', number: 'P-1036', customerId: 'c-norte', seller: 'Joni', createdAt: h(9, 9, 0),
    status: 'entregado', billing: 'facturado', collection: 'vence_pronto', paymentTerm: '30 días',
    expectedCollection: addDays(TODAY, 3), items: [it('sv-reg', 30, 8), it('sv-ks', 20, 8), it('sv-disp', 4, 8)],
    duxRefs: { sauver: 'PED-004362' }, invoiceRefs: { sauver: 'FA 0003-00018840' },
    events: [
      { at: h(9, 9, 0), label: 'Pedido creado', by: 'Joni' },
      { at: h(9, 10, 0), label: 'Cargado en Dux Sauver', by: 'Carla' },
      { at: h(7, 15, 0), label: 'Entregado', by: 'Ramón' },
      { at: h(6, 10, 0), label: 'Factura vinculada desde import Dux', by: 'Sistema' },
    ],
  },
  {
    id: 'o-1033', number: 'P-1033', customerId: 'c-rivas', seller: 'Tomás', createdAt: h(22, 12, 0),
    status: 'entregado', billing: 'facturado', collection: 'vencido', paymentTerm: '15 días',
    expectedCollection: addDays(TODAY, -4), items: [it('sv-ks', 8), it('sv-slim', 6), it('sv-reg', 4)],
    duxRefs: { sauver: 'PED-004318' }, invoiceRefs: { sauver: 'FA 0003-00018790' },
    events: [
      { at: h(22, 12, 0), label: 'Pedido enviado desde el celular', by: 'Tomás' },
      { at: h(20, 10, 0), label: 'Entregado', by: 'Ramón' },
      { at: h(19, 10, 0), label: 'Factura vinculada desde import Dux', by: 'Sistema' },
      { at: h(4, 18, 0), label: 'Cliente pidió pasar el cobro al viernes', by: 'Carla' },
    ],
  },
  {
    id: 'o-1031', number: 'P-1031', customerId: 'c-24', seller: 'Tomás', createdAt: h(12, 10, 0),
    status: 'entregado', billing: 'facturado', collection: 'cobrado', paymentTerm: '7 días',
    items: [it('sv-reg', 3), it('sv-ks', 2)], duxRefs: { sauver: 'PED-004350' }, invoiceRefs: { sauver: 'FB 0003-00018812' },
    events: [
      { at: h(12, 10, 0), label: 'Pedido enviado desde el celular', by: 'Tomás' },
      { at: h(10, 11, 0), label: 'Entregado', by: 'Ramón' },
      { at: h(3, 12, 0), label: 'Cobro registrado en Dux (import)', by: 'Sistema' },
    ],
  },
  {
    id: 'o-1030', number: 'P-1030', customerId: 'c-sur', seller: 'Joni', createdAt: h(16, 10, 0),
    status: 'entregado', billing: 'facturado', collection: 'parcial', paymentTerm: '30 días',
    expectedCollection: addDays(TODAY, 6), items: [it('sv-reg', 26, 8), it('sv-ks', 12, 8)],
    duxRefs: { sauver: 'PED-004330' }, invoiceRefs: { sauver: 'FA 0003-00018801' },
    events: [
      { at: h(16, 10, 0), label: 'Pedido creado', by: 'Joni' },
      { at: h(14, 10, 0), label: 'Entregado', by: 'Ramón' },
      { at: h(5, 10, 0), label: 'Cobro parcial $ 400.000 (import Dux)', by: 'Sistema' },
    ],
  },
]

export function paymentTermDays(term: string): number {
  const m = term.match(/(\d+)/)
  return m ? Number(m[1]) : 0
}
