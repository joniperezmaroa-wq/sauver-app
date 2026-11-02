// Lecturas reactivas de la base local: cualquier cambio (propio o sincronizado) actualiza la pantalla.

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Customer, Order, OrderItem, Product, Profile, Settings, Visit } from './types'

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  max_discount: 5,
  default_warehouse: 'San Telmo',
  prices_include_vat: false,
  payment_terms: ['Contado', '7 días', '15 días', '30 días', '45 días'],
  updated_at: '',
}

export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get(1), []) ?? DEFAULT_SETTINGS
}

export function useProducts(includeInactive = false): Product[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.products.toArray()
    return all
      .filter((p) => includeInactive || p.active)
      .sort((a, b) => a.business_unit.localeCompare(b.business_unit) || a.sort - b.sort || a.name.localeCompare(b.name))
  }, [includeInactive])
}

export function useCustomers(ownerId?: string): Customer[] | undefined {
  return useLiveQuery(async () => {
    const all = ownerId ? await db.customers.where('owner_id').equals(ownerId).toArray() : await db.customers.toArray()
    return all.sort((a, b) => a.name.localeCompare(b.name))
  }, [ownerId])
}

export function useCustomer(id: string | undefined): Customer | undefined | null {
  return useLiveQuery(async () => (id ? (await db.customers.get(id)) ?? null : null), [id])
}

export function useCustomerMap(): Map<string, Customer> {
  return useLiveQuery(async () => new Map((await db.customers.toArray()).map((c) => [c.id, c])), []) ?? new Map()
}

export function useVisits(filter: { customerId?: string; sellerId?: string } = {}): Visit[] | undefined {
  return useLiveQuery(async () => {
    let rows: Visit[]
    if (filter.customerId) rows = await db.visits.where('customer_id').equals(filter.customerId).toArray()
    else if (filter.sellerId) rows = await db.visits.where('seller_id').equals(filter.sellerId).toArray()
    else rows = await db.visits.toArray()
    return rows.sort((a, b) => b.visited_at.localeCompare(a.visited_at))
  }, [filter.customerId, filter.sellerId])
}

export function useOrders(filter: { customerId?: string; sellerId?: string } = {}): Order[] | undefined {
  return useLiveQuery(async () => {
    let rows: Order[]
    if (filter.customerId) rows = await db.orders.where('customer_id').equals(filter.customerId).toArray()
    else if (filter.sellerId) rows = await db.orders.where('seller_id').equals(filter.sellerId).toArray()
    else rows = await db.orders.toArray()
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [filter.customerId, filter.sellerId])
}

export function useOrderItems(orderId: string | undefined): OrderItem[] {
  return useLiveQuery(async () => (orderId ? db.order_items.where('order_id').equals(orderId).toArray() : []), [orderId]) ?? []
}

export function useProfiles(): Map<string, Profile> {
  return useLiveQuery(async () => new Map((await db.profiles.toArray()).map((p) => [p.id, p])), []) ?? new Map()
}

export function orderLabel(o: Order): string {
  return o.number ? `P-${o.number}` : 'Pendiente de envío'
}
