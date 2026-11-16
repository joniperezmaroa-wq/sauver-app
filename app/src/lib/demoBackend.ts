// Reemplazo local de Supabase para el modo demo: implementa solo lo que la app usa
// (tablas, funciones de pedidos y fotos) sobre la base del dispositivo.

import { db, uuid } from './db'
import { demoRole, DEMO_PROFILES } from './demo'
import type { Order, OrderItem, OrderStatus } from './types'

type Res = { data: unknown; error: { message: string } | null }

const LOCAL: Record<string, string> = {
  app_settings: 'settings',
  seller_targets: 'targets',
  customer_balances: 'balances',
  products: 'products',
  customers: 'customers',
  visits: 'visits',
  daily_checks: 'daily_checks',
  profiles: 'profiles',
  orders: 'orders',
  order_items: 'order_items',
  order_events: 'order_events',
}

let allowed = Object.values(DEMO_PROFILES).map((p) => ({ email: p.email, full_name: p.full_name, role: p.role, created_at: '' }))

const ok = (data: unknown = null): Res => ({ data, error: null })
const fail = (message: string): Res => ({ data: null, error: { message } })

const strip = (row: Record<string, unknown>) => {
  const { _pending, ...rest } = row
  void _pending
  return { ...rest, updated_at: new Date().toISOString() }
}

class Query implements PromiseLike<Res> {
  private op: 'select' | 'upsert' | 'insert' | 'update' = 'select'
  private rows: Record<string, unknown>[] = []
  private patch: Record<string, unknown> = {}
  private filters: [string, unknown][] = []
  constructor(private table: string) {}

  select() {
    return this
  }
  upsert(r: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = 'upsert'
    this.rows = Array.isArray(r) ? r : [r]
    return this
  }
  insert(r: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = 'insert'
    this.rows = Array.isArray(r) ? r : [r]
    return this
  }
  update(p: Record<string, unknown>) {
    this.op = 'update'
    this.patch = p
    return this
  }
  eq(col: string, val: unknown) {
    this.filters.push([col, val])
    return this
  }
  gte() {
    return this
  }
  order() {
    return this
  }
  limit() {
    return this
  }
  maybeSingle() {
    return this
  }

  private async run(): Promise<Res> {
    if (this.table === 'allowed_users') {
      if (this.op === 'select') return ok(allowed)
      for (const r of this.rows) allowed = [...allowed.filter((a) => a.email !== r.email), { ...(r as (typeof allowed)[number]), created_at: new Date().toISOString() }]
      return ok()
    }
    const name = LOCAL[this.table]
    if (!name) return fail(`Tabla desconocida: ${this.table}`)
    const t = db.table(name)
    // La app no descarga nada del "servidor" en demo: los datos ya están en el dispositivo.
    if (this.op === 'select') return ok([])
    if (this.op === 'update') {
      const id = this.filters.find(([c]) => c === 'id')?.[1]
      await t.update(id as never, { ...this.patch, updated_at: new Date().toISOString() })
      return ok()
    }
    const rows = this.rows.map((r) => strip(this.op === 'insert' && !r.id && name === 'products' ? { ...r, id: uuid() } : r))
    if (name === 'daily_checks') rows.forEach((r) => ((r as Record<string, unknown>).by = currentId()))
    await t.bulkPut(rows)
    return ok()
  }

  then<A = Res, B = never>(onOk?: ((v: Res) => A | PromiseLike<A>) | null, onErr?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return this.run().then(onOk, onErr)
  }
}

const currentId = () => DEMO_PROFILES[demoRole() ?? 'vendedor'].id

async function nextEvent() {
  const n = Number((await db.meta.get('demo_event'))?.value ?? '1')
  await db.meta.put({ key: 'demo_event', value: String(n + 1) })
  return n
}

async function addEvent(order_id: string, status: string, label: string) {
  const now = new Date().toISOString()
  await db.order_events.put({ id: await nextEvent(), order_id, at: now, by: currentId(), status, label, updated_at: now })
}

const LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  recibido: 'Recibido por Administración',
  cargado_dux: 'Cargado en Dux',
  preparando: 'En preparación',
  listo: 'Listo para entregar',
  entregado: 'Entregado',
}

async function rpc(name: string, a: Record<string, unknown>): Promise<Res> {
  const role = demoRole()
  const staff = role === 'admin' || role === 'gerencia'
  if (name === 'create_order') {
    const p = a.p as { id: string; customer_id: string; visit_id: string | null; payment_term: string; discount_pct: number; notes: string; created_at: string; items: { product_id: string; packs: number }[] }
    const existing = await db.orders.get(p.id)
    if (existing && !existing._pending) return ok(existing)
    const settings = await db.settings.get(1)
    const seq = Number((await db.meta.get('demo_seq'))?.value ?? '1003') + 1
    await db.meta.put({ key: 'demo_seq', value: String(seq) })
    const disc = Number(p.discount_pct) || 0
    const now = new Date().toISOString()
    const items: OrderItem[] = []
    for (const it of p.items) {
      const pr = await db.products.get(it.product_id)
      if (!pr) return fail('Producto inexistente')
      items.push({
        id: uuid(), order_id: p.id, product_id: pr.id, business_unit: pr.business_unit, product_name: pr.name, presentation: pr.presentation,
        packs: it.packs, list_price: Number(pr.price), discount_pct: disc, subtotal: Math.round(it.packs * Number(pr.price) * (1 - disc / 100)), updated_at: now,
      })
    }
    const order: Order = {
      id: p.id, number: seq, customer_id: p.customer_id, seller_id: currentId(), visit_id: p.visit_id, status: 'nuevo', payment_term: p.payment_term,
      discount_pct: disc, needs_approval: disc > (settings?.max_discount ?? 5), warehouse: settings?.default_warehouse ?? 'San Telmo', notes: p.notes || null,
      dux_ref_sauver: null, dux_ref_joni: null, total: items.reduce((s, i) => s + i.subtotal, 0), created_at: p.created_at ?? now, updated_at: now,
    }
    await db.transaction('rw', db.orders, db.order_items, async () => {
      await db.order_items.where('order_id').equals(p.id).delete()
      await db.order_items.bulkPut(items)
      await db.orders.put(order)
    })
    await addEvent(p.id, 'nuevo', order.needs_approval ? 'Pedido enviado · descuento a aprobar' : 'Pedido enviado')
    return ok(order)
  }
  const id = a.p_order_id as string
  const o = await db.orders.get(id)
  if (!o) return fail('Pedido inexistente')
  if (name === 'set_order_status') {
    if (!staff) return fail('Sin permiso')
    const status = a.p_status as OrderStatus
    const patch: Partial<Order> = { status, updated_at: new Date().toISOString() }
    if (a.p_dux_sauver) patch.dux_ref_sauver = a.p_dux_sauver as string
    if (a.p_dux_joni) patch.dux_ref_joni = a.p_dux_joni as string
    await db.orders.update(id, patch)
    await addEvent(id, status, LABEL[status] + (a.p_dux_sauver ? ` · Dux Sauver ${a.p_dux_sauver}` : '') + (a.p_dux_joni ? ` · Dux Joni ${a.p_dux_joni}` : ''))
    return ok()
  }
  if (name === 'cancel_order') {
    if (!(staff ? o.status !== 'entregado' : o.status === 'nuevo')) return fail('No se puede cancelar este pedido')
    await db.orders.update(id, { status: 'cancelado', updated_at: new Date().toISOString() })
    await addEvent(id, 'cancelado', `Cancelado · ${a.p_reason || 'sin motivo'}`)
    return ok()
  }
  if (name === 'approve_order') {
    if (role !== 'gerencia') return fail('Solo Gerencia aprueba descuentos')
    await db.orders.update(id, { needs_approval: false, updated_at: new Date().toISOString() })
    await addEvent(id, o.status, 'Descuento aprobado')
    return ok()
  }
  return fail(`Función desconocida: ${name}`)
}

const channel = { on: () => channel, subscribe: () => channel }

export const demoClient = {
  from: (t: string) => new Query(t),
  rpc: (n: string, a: Record<string, unknown>) => rpc(n, a),
  storage: {
    from: () => ({
      upload: async () => ok(),
      createSignedUrl: async () => ok(null),
    }),
  },
  channel: () => channel,
  removeChannel: async () => undefined,
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    signOut: async () => ({ error: null }),
  },
}
