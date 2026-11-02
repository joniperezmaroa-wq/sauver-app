// Tipos de las tablas de Supabase (ver supabase/migrations).

export type Role = 'gerencia' | 'admin' | 'vendedor' | 'sin_acceso'
export type UnitId = 'sauver' | 'joni' | 'grower'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  active: boolean
  updated_at: string
}

export interface Settings {
  id: number
  max_discount: number
  default_warehouse: string
  prices_include_vat: boolean
  payment_terms: string[]
  updated_at: string
}

export interface SellerTarget {
  seller_id: string
  weekly_sales: number
  weekly_visits: number
  weekly_new_customers: number
  updated_at: string
}

export interface Product {
  id: string
  business_unit: UnitId
  code: string | null
  name: string
  presentation: string
  units_per_pack: number
  price: number
  active: boolean
  sort: number
  updated_at: string
}

export type CustomerStatus = 'prospecto' | 'activo' | 'inactivo'

export interface Customer {
  id: string
  name: string
  legal_name: string | null
  cuit: string | null
  channel: string
  zone: string | null
  address: string | null
  contact_name: string | null
  whatsapp: string | null
  email: string | null
  payment_term: string
  status: CustomerStatus
  notes: string | null
  owner_id: string
  dux_code_sauver: string | null
  dux_code_joni: string | null
  created_at: string
  updated_at: string
  /** Solo local: creado/editado sin señal y pendiente de enviar */
  _pending?: 1
}

export interface Balance {
  customer_id: string
  balance: number
  overdue: number
  updated_at: string
}

export type Outcome = 'compro' | 'interesado' | 'volver' | 'no_interesado' | 'no_hablo'

export interface Visit {
  id: string
  customer_id: string
  seller_id: string
  visited_at: string
  outcome: Outcome
  interest: string[]
  objections: string[]
  reason: string | null
  next_visit: string | null
  comment: string | null
  photo_path: string | null
  created_at: string
  updated_at: string
  _pending?: 1
}

export type OrderStatus = 'nuevo' | 'recibido' | 'cargado_dux' | 'preparando' | 'listo' | 'entregado' | 'cancelado'

export interface Order {
  id: string
  number: number | null
  customer_id: string
  seller_id: string
  visit_id: string | null
  status: OrderStatus
  payment_term: string
  discount_pct: number
  needs_approval: boolean
  warehouse: string
  notes: string | null
  dux_ref_sauver: string | null
  dux_ref_joni: string | null
  total: number
  created_at: string
  updated_at: string
  _pending?: 1
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  business_unit: UnitId
  product_name: string
  presentation: string
  packs: number
  list_price: number
  discount_pct: number
  subtotal: number
  updated_at: string
}

export interface OrderEvent {
  id: number
  order_id: string
  at: string
  by: string | null
  status: string | null
  label: string
  updated_at: string
}

export interface DailyCheck {
  day: string
  item: string
  done: boolean
  by: string | null
  updated_at: string
}

export const UNIT_NAME: Record<UnitId, string> = { sauver: 'Sauver', joni: 'Joni', grower: 'Grower Things' }
export const UNIT_SHORT: Record<UnitId, string> = { sauver: 'SV', joni: 'JN', grower: 'GT' }
export const UNIT_DUX: Record<UnitId, string> = { sauver: 'Dux Sauver', joni: 'Dux Joni', grower: 'Dux Joni' }

export const STATUS_FLOW: OrderStatus[] = ['nuevo', 'recibido', 'cargado_dux', 'preparando', 'listo', 'entregado']

export const STATUS_LABEL: Record<OrderStatus, string> = {
  nuevo: 'Nuevo',
  recibido: 'Recibido',
  cargado_dux: 'Cargado en Dux',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  compro: 'Compró',
  interesado: 'Interesado',
  volver: 'Volver',
  no_interesado: 'No interesado',
  no_hablo: 'No pudo hablar',
}

export const CHANNELS = ['Kiosco', 'Tabaquería', 'Distribuidor', 'Growshop', 'Otro']
