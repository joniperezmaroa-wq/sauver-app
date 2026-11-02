// Acciones del vendedor que funcionan sin señal: se guardan en el dispositivo y se envían solas.

import { db, uuid } from './db'
import { enqueue } from './sync'
import type { CompressedPhoto } from './image'
import type { Customer, Order, OrderItem, Outcome, Product, Visit } from './types'

export async function saveCustomer(c: Customer) {
  const row: Customer = { ...c, updated_at: new Date().toISOString(), _pending: 1 }
  await db.customers.put(row)
  await enqueue({ kind: 'customer', ref: c.id, payload: row })
}

export function newCustomer(ownerId: string, fields: Partial<Customer>): Customer {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    name: '',
    legal_name: null,
    cuit: null,
    channel: 'Kiosco',
    zone: null,
    address: null,
    contact_name: null,
    whatsapp: null,
    email: null,
    payment_term: 'Contado',
    status: 'prospecto',
    notes: null,
    owner_id: ownerId,
    dux_code_sauver: null,
    dux_code_joni: null,
    created_at: now,
    updated_at: now,
    ...fields,
  }
}

export async function saveVisit(v: {
  id: string
  customerId: string
  sellerId: string
  outcome: Outcome
  interest?: string[]
  objections?: string[]
  reason?: string | null
  nextVisit?: string | null
  comment?: string | null
  photo?: { blob: Blob } | null
}) {
  const now = new Date().toISOString()
  const path = v.photo ? `${v.sellerId}/${v.id}.webp` : null
  if (v.photo && path) await db.photos.put({ id: v.id, blob: v.photo.blob, path })
  const row: Visit = {
    id: v.id,
    customer_id: v.customerId,
    seller_id: v.sellerId,
    visited_at: now,
    outcome: v.outcome,
    interest: v.interest ?? [],
    objections: v.objections ?? [],
    reason: v.reason ?? null,
    next_visit: v.nextVisit ?? null,
    comment: v.comment || null,
    photo_path: path,
    created_at: now,
    updated_at: now,
    _pending: 1,
  }
  await db.visits.put(row)
  await enqueue({ kind: 'visit', ref: v.id, payload: row })
}

/** El precio final lo calcula el servidor; acá se estima para mostrarlo mientras no hay señal. */
export async function saveOrder(o: {
  customer: Customer
  sellerId: string
  visitId: string | null
  paymentTerm: string
  discountPct: number
  maxDiscount: number
  notes: string
  lines: { product: Product; packs: number }[]
  warehouse: string
}): Promise<Order> {
  const id = uuid()
  const now = new Date().toISOString()
  const items: OrderItem[] = o.lines.map((l) => ({
    id: uuid(),
    order_id: id,
    product_id: l.product.id,
    business_unit: l.product.business_unit,
    product_name: l.product.name,
    presentation: l.product.presentation,
    packs: l.packs,
    list_price: Number(l.product.price),
    discount_pct: o.discountPct,
    subtotal: Math.round(l.packs * Number(l.product.price) * (1 - o.discountPct / 100)),
    updated_at: now,
  }))
  const order: Order = {
    id,
    number: null,
    customer_id: o.customer.id,
    seller_id: o.sellerId,
    visit_id: o.visitId,
    status: 'nuevo',
    payment_term: o.paymentTerm,
    discount_pct: o.discountPct,
    needs_approval: o.discountPct > o.maxDiscount,
    warehouse: o.warehouse,
    notes: o.notes || null,
    dux_ref_sauver: null,
    dux_ref_joni: null,
    total: items.reduce((s, i) => s + i.subtotal, 0),
    created_at: now,
    updated_at: now,
    _pending: 1,
  }
  await db.transaction('rw', db.orders, db.order_items, async () => {
    await db.orders.put(order)
    await db.order_items.bulkPut(items)
  })
  if (o.customer.status === 'prospecto') await db.customers.update(o.customer.id, { status: 'activo' })
  await enqueue({
    kind: 'order',
    ref: id,
    payload: {
      id,
      customer_id: o.customer.id,
      visit_id: o.visitId,
      payment_term: o.paymentTerm,
      discount_pct: o.discountPct,
      notes: o.notes,
      created_at: now,
      items: o.lines.map((l) => ({ product_id: l.product.id, packs: l.packs })),
    },
  })
  return order
}

export type { CompressedPhoto }
