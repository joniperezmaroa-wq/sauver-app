// Base local del dispositivo (IndexedDB). La app siempre lee de acá, así funciona sin señal;
// el motor de sincronización (sync.ts) la mantiene al día con Supabase.

import Dexie, { type Table } from 'dexie'
import type {
  Balance,
  Customer,
  DailyCheck,
  Order,
  OrderEvent,
  OrderItem,
  Product,
  Profile,
  SellerTarget,
  Settings,
  Visit,
} from './types'

export type OutboxKind = 'customer' | 'visit' | 'order'

export interface OutboxEntry {
  seq?: number
  kind: OutboxKind
  ref: string
  payload: unknown
  created_at: string
  attempts: number
  last_error?: string
}

export interface LocalPhoto {
  /** id de la visita */
  id: string
  blob: Blob
  path: string
}

export interface Meta {
  key: string
  value: string
}

class SauverDB extends Dexie {
  products!: Table<Product, string>
  customers!: Table<Customer, string>
  balances!: Table<Balance, string>
  visits!: Table<Visit, string>
  orders!: Table<Order, string>
  order_items!: Table<OrderItem, string>
  order_events!: Table<OrderEvent, number>
  settings!: Table<Settings, number>
  targets!: Table<SellerTarget, string>
  profiles!: Table<Profile, string>
  daily_checks!: Table<DailyCheck, [string, string]>
  outbox!: Table<OutboxEntry, number>
  photos!: Table<LocalPhoto, string>
  meta!: Table<Meta, string>

  constructor() {
    super('sauver')
    this.version(1).stores({
      products: 'id, business_unit, active',
      customers: 'id, owner_id, status, updated_at',
      balances: 'customer_id',
      visits: 'id, customer_id, seller_id, visited_at',
      orders: 'id, customer_id, seller_id, status, created_at',
      order_items: 'id, order_id',
      order_events: 'id, order_id',
      settings: 'id',
      targets: 'seller_id',
      profiles: 'id',
      daily_checks: '[day+item], day',
      outbox: '++seq, kind, ref',
      photos: 'id',
      meta: 'key',
    })
  }
}

export const db = new SauverDB()

export async function getMeta(key: string): Promise<string | undefined> {
  return (await db.meta.get(key))?.value
}

export async function setMeta(key: string, value: string) {
  await db.meta.put({ key, value })
}

/** Al cerrar sesión se borra todo lo local, salvo que haya cosas sin enviar (se avisa antes). */
export async function clearLocal() {
  await Promise.all(db.tables.map((t) => t.clear()))
}

export function uuid(): string {
  return crypto.randomUUID()
}
