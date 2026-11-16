// Modo demo: la misma app, sin servidor. Los datos de ejemplo viven solo en este dispositivo,
// así se puede probar el circuito completo (vendedor → pedido → Administración) desde el celular.
// Se activa construyendo con `npm run build:demo`.

import { db, uuid } from './db'
import { readPref, writePref } from './storage'
import type { Customer, Order, OrderItem, Product, Profile, Role, Visit } from './types'

export const isDemo = import.meta.env.MODE === 'demo'

export const DEMO_PROFILES: Record<Exclude<Role, 'sin_acceso'>, Profile> = {
  vendedor: { id: 'demo-ezequiel', email: 'vendedor@demo', full_name: 'Ezequiel', role: 'vendedor', active: true, updated_at: '' },
  admin: { id: 'demo-yamila', email: 'administracion@demo', full_name: 'Yamila', role: 'admin', active: true, updated_at: '' },
  gerencia: { id: 'demo-joni', email: 'gerencia@demo', full_name: 'Joni', role: 'gerencia', active: true, updated_at: '' },
}

export function demoRole(): Exclude<Role, 'sin_acceso'> | null {
  const r = readPref('demo_role')
  return r === 'vendedor' || r === 'admin' || r === 'gerencia' ? r : null
}

export function setDemoRole(r: Exclude<Role, 'sin_acceso'> | null) {
  writePref('demo_role', r)
}

const iso = (daysAgo: number, hour = 11) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}
const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Carga los datos de ejemplo la primera vez (o después de "empezar de cero"). */
export async function seedDemo(force = false) {
  if (!force && (await db.meta.get('demo_seeded'))) return
  await Promise.all(db.tables.map((t) => t.clear()))
  const now = new Date().toISOString()
  const eze = DEMO_PROFILES.vendedor.id

  await db.profiles.bulkPut(Object.values(DEMO_PROFILES).map((p) => ({ ...p, updated_at: now })))
  await db.settings.put({ id: 1, max_discount: 5, default_warehouse: 'San Telmo', prices_include_vat: false, payment_terms: ['Contado', '7 días', '15 días', '30 días'], updated_at: now })
  await db.targets.put({ seller_id: eze, weekly_sales: 1_500_000, weekly_visits: 12, weekly_new_customers: 2, updated_at: now })

  const p = (id: string, business_unit: Product['business_unit'], name: string, presentation: string, units: number, price: number, sort: number): Product => ({
    id, business_unit, code: id.toUpperCase(), name, presentation, units_per_pack: units, price, active: true, sort, updated_at: now,
  })
  await db.products.bulkPut([
    p('sv-reg', 'sauver', 'Regular', 'Caja x 50', 50, 24_000, 10),
    p('sv-ks', 'sauver', 'Kingsize', 'Caja x 50', 50, 31_000, 20),
    p('sv-slim', 'sauver', 'Slim', 'Caja x 50', 50, 27_000, 30),
    p('sv-disp', 'sauver', 'Display mixto', 'Display x 120', 120, 62_000, 40),
    p('jn-pap', 'joni', 'Papers 1¼', 'Display x 25', 25, 21_000, 10),
    p('jn-grind', 'joni', 'Grinder metálico', 'Unidad', 1, 15_000, 20),
    p('gt-sust', 'grower', 'Sustrato premium 25 L', 'Unidad', 1, 9_800, 10),
  ])

  const c = (id: string, name: string, channel: string, zone: string, address: string, term: string, status: Customer['status'], daysAgo: number): Customer => ({
    id, name, legal_name: null, cuit: null, channel, zone, address, contact_name: null, whatsapp: '11 5555 0000', email: null,
    payment_term: term, status, notes: null, owner_id: eze, dux_code_sauver: null, dux_code_joni: null, created_at: iso(daysAgo), updated_at: iso(daysAgo),
  })
  await db.customers.bulkPut([
    c('c-esquina', 'Kiosco La Esquina', 'Kiosco', 'San Telmo', 'Defensa 900', '7 días', 'activo', 40),
    c('c-humo', 'Tabaquería Humo', 'Tabaquería', 'Palermo', 'Honduras 4800', 'Contado', 'activo', 30),
    c('c-plaza', 'Maxikiosco Plaza', 'Kiosco', 'Constitución', 'Lima 1500', 'Contado', 'activo', 25),
    c('c-raiz', 'Growshop Raíz', 'Growshop', 'Almagro', 'Medrano 800', '15 días', 'activo', 20),
    c('c-estacion', 'Kiosco La Estación', 'Kiosco', 'Barracas', 'Montes de Oca 300', 'Contado', 'prospecto', 6),
  ])
  await db.balances.bulkPut([
    { customer_id: 'c-esquina', balance: 96_000, overdue: 0, updated_at: now },
    { customer_id: 'c-raiz', balance: 205_000, overdue: 54_000, updated_at: now },
  ])

  const v = (id: string, customer_id: string, daysAgo: number, outcome: Visit['outcome'], next: string | null, comment: string | null): Visit => ({
    id, customer_id, seller_id: eze, visited_at: iso(daysAgo), outcome, interest: [], objections: outcome === 'interesado' ? ['Quiere probar'] : [],
    reason: null, next_visit: next, comment, photo_path: null, created_at: iso(daysAgo), updated_at: iso(daysAgo),
  })
  await db.visits.bulkPut([
    v('v1', 'c-esquina', 9, 'compro', null, 'Repone cada dos semanas.'),
    v('v2', 'c-estacion', 6, 'interesado', day(0), 'Volver con muestra de Regular.'),
    v('v3', 'c-humo', 16, 'compro', null, null),
    v('v4', 'c-raiz', 3, 'compro', null, null),
  ])

  const order = (id: string, number: number, customer_id: string, daysAgo: number, status: Order['status'], term: string, lines: [string, number][]): [Order, OrderItem[]] => {
    const items = lines.map(([pid, packs]) => {
      const pr = [...PRICES].find((x) => x[0] === pid)!
      return {
        id: uuid(), order_id: id, product_id: pid, business_unit: pr[1], product_name: pr[2], presentation: pr[3], packs,
        list_price: pr[4], discount_pct: 0, subtotal: packs * pr[4], updated_at: now,
      } satisfies OrderItem
    })
    return [
      {
        id, number, customer_id, seller_id: eze, visit_id: null, status, payment_term: term, discount_pct: 0, needs_approval: false, warehouse: 'San Telmo',
        notes: null, dux_ref_sauver: status === 'nuevo' ? null : `PED-00${number}`, dux_ref_joni: null,
        total: items.reduce((s, i) => s + i.subtotal, 0), created_at: iso(daysAgo, 12), updated_at: iso(daysAgo, 12),
      },
      items,
    ]
  }
  const seeded = [
    order('o-1001', 1001, 'c-esquina', 9, 'entregado', '7 días', [['sv-reg', 3], ['sv-ks', 1]]),
    order('o-1002', 1002, 'c-raiz', 3, 'listo', '15 días', [['sv-slim', 4], ['gt-sust', 3]]),
  ]
  await db.orders.bulkPut(seeded.map((x) => x[0]))
  await db.order_items.bulkPut(seeded.flatMap((x) => x[1]))
  let ev = 1
  await db.order_events.bulkPut(
    seeded.flatMap(([o]) => [
      { id: ev++, order_id: o.id, at: o.created_at, by: eze, status: 'nuevo', label: 'Pedido enviado', updated_at: now },
      { id: ev++, order_id: o.id, at: o.created_at, by: DEMO_PROFILES.admin.id, status: o.status, label: o.status === 'entregado' ? 'Entregado' : 'Listo para entregar', updated_at: now },
    ]),
  )
  await db.meta.bulkPut([
    { key: 'demo_seeded', value: now },
    { key: 'demo_seq', value: '1003' },
    { key: 'demo_event', value: String(ev) },
  ])
}

const PRICES: [string, Product['business_unit'], string, string, number][] = [
  ['sv-reg', 'sauver', 'Regular', 'Caja x 50', 24_000],
  ['sv-ks', 'sauver', 'Kingsize', 'Caja x 50', 31_000],
  ['sv-slim', 'sauver', 'Slim', 'Caja x 50', 27_000],
  ['gt-sust', 'grower', 'Sustrato premium 25 L', 'Unidad', 9_800],
]
