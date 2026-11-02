// Sincronización con Supabase.
//  · push: envía lo que el dispositivo guardó (clientes, visitas con foto, pedidos) en orden.
//  · pull: trae lo que cambió en el servidor desde la última vez (según updated_at).
// Todo lo que se envía lleva un id generado en el dispositivo, así un reintento nunca duplica.

import { useSyncExternalStore } from 'react'
import { db, getMeta, setMeta, type OutboxEntry } from './db'
import { supabase, isConfigured, isNetworkError, errorText } from './supabase'
import type { Customer, Order, Visit } from './types'

const TABLES = [
  { name: 'settings', remote: 'app_settings' },
  { name: 'profiles', remote: 'profiles' },
  { name: 'targets', remote: 'seller_targets' },
  { name: 'products', remote: 'products' },
  { name: 'customers', remote: 'customers' },
  { name: 'balances', remote: 'customer_balances' },
  { name: 'visits', remote: 'visits' },
  { name: 'orders', remote: 'orders' },
  { name: 'order_items', remote: 'order_items' },
  { name: 'order_events', remote: 'order_events' },
  { name: 'daily_checks', remote: 'daily_checks', staffOnly: true },
] as const

const PAGE = 1000

// ————— Estado observable —————

export interface SyncState {
  online: boolean
  syncing: boolean
  pending: number
  failed: number
  lastSync: string | null
  lastError: string | null
}

let state: SyncState = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  syncing: false,
  pending: 0,
  failed: 0,
  lastSync: null,
  lastError: null,
}
const listeners = new Set<() => void>()
function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

async function refreshCounts() {
  const all = await db.outbox.toArray()
  set({ pending: all.length, failed: all.filter((e) => e.attempts > 0 && e.last_error).length })
}

// ————— Cola de envío —————

export async function enqueue(entry: Omit<OutboxEntry, 'created_at' | 'attempts'>) {
  await db.outbox.add({ ...entry, created_at: new Date().toISOString(), attempts: 0 })
  await refreshCounts()
  void syncNow()
}

function strip<T extends { _pending?: 1 }>(row: T): Omit<T, '_pending'> {
  const { _pending: _p, ...rest } = row
  void _p
  return rest
}

async function pushOne(e: OutboxEntry) {
  if (e.kind === 'customer') {
    const c = e.payload as Customer
    const { error } = await supabase.from('customers').upsert(strip(c), { onConflict: 'id' })
    if (error) throw error
    return
  }
  if (e.kind === 'visit') {
    const v = e.payload as Visit
    const photo = await db.photos.get(v.id)
    if (photo) {
      const { error } = await supabase.storage.from('fotos').upload(photo.path, photo.blob, {
        contentType: photo.blob.type || 'image/webp',
        upsert: false,
      })
      if (error && !/exists|duplicate/i.test(error.message)) throw error
    }
    const { error } = await supabase.from('visits').upsert(strip(v), { onConflict: 'id', ignoreDuplicates: true })
    if (error) throw error
    return
  }
  if (e.kind === 'order') {
    const { data, error } = await supabase.rpc('create_order', { p: e.payload })
    if (error) throw error
    const order = data as Order
    await db.transaction('rw', db.orders, db.order_items, async () => {
      await db.order_items.where('order_id').equals(order.id).delete()
      await db.orders.put(order)
    })
  }
}

async function push(): Promise<boolean> {
  const entries = await db.outbox.orderBy('seq').toArray()
  for (const e of entries) {
    try {
      await pushOne(e)
      await db.outbox.delete(e.seq!)
    } catch (err) {
      if (isNetworkError(err)) return false
      await db.outbox.update(e.seq!, { attempts: e.attempts + 1, last_error: errorText(err) })
    }
  }
  return true
}

// ————— Descarga incremental —————

async function pullTable(name: (typeof TABLES)[number]['name'], remote: string) {
  const cursorKey = `cursor:${name}`
  let cursor = (await getMeta(cursorKey)) ?? '1970-01-01T00:00:00Z'
  for (;;) {
    const { data, error } = await supabase.from(remote).select('*').gte('updated_at', cursor).order('updated_at').limit(PAGE)
    if (error) throw error
    const rows = (data ?? []) as { updated_at: string; id?: string }[]
    if (rows.length) {
      const table = db.table(name)
      // No pisar lo que el dispositivo todavía no envió.
      const pendingIds = new Set(
        name === 'customers' || name === 'visits' || name === 'orders'
          ? ((await table.filter((r: { _pending?: 1 }) => r._pending === 1).primaryKeys()) as string[])
          : [],
      )
      await table.bulkPut(rows.filter((r) => !r.id || !pendingIds.has(r.id)))
      cursor = rows[rows.length - 1].updated_at
      await setMeta(cursorKey, cursor)
    }
    if (rows.length < PAGE) break
  }
}

async function pull(isStaff: boolean) {
  for (const t of TABLES) {
    if ('staffOnly' in t && t.staffOnly && !isStaff) continue
    await pullTable(t.name, t.remote)
  }
}

// ————— Orquestación —————

let running: Promise<void> | null = null
let again = false
let staff = false

export function syncNow(): Promise<void> {
  if (!isConfigured) return Promise.resolve()
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    set({ syncing: true })
    try {
      do {
        again = false
        const ok = await push()
        if (ok && navigator.onLine) {
          await pull(staff)
          set({ lastSync: new Date().toISOString(), lastError: null })
        }
      } while (again)
    } catch (err) {
      set({ lastError: errorText(err) })
    } finally {
      await refreshCounts()
      set({ syncing: false })
      running = null
    }
  })()
  return running
}

let timer: number | undefined
let channel: ReturnType<typeof supabase.channel> | null = null

/** Arranca la sincronización periódica para el usuario que inició sesión. */
export function startSync(opts: { isStaff: boolean }) {
  staff = opts.isStaff
  stopSync()
  const onOnline = () => {
    set({ online: true })
    void syncNow()
  }
  const onOffline = () => set({ online: false })
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  const onVisible = () => document.visibilityState === 'visible' && void syncNow()
  document.addEventListener('visibilitychange', onVisible)
  timer = window.setInterval(() => void syncNow(), 45_000)
  if (staff) {
    channel = supabase
      .channel('pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void syncNow())
      .subscribe()
  }
  cleanup = () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    document.removeEventListener('visibilitychange', onVisible)
  }
  void refreshCounts()
  void syncNow()
}

let cleanup: (() => void) | null = null

export function stopSync() {
  if (timer) window.clearInterval(timer)
  timer = undefined
  cleanup?.()
  cleanup = null
  if (channel) void supabase.removeChannel(channel)
  channel = null
}

/** URL para ver una foto: la copia local si todavía no se subió, si no un enlace firmado temporal. */
const urlCache = new Map<string, { url: string; exp: number }>()
export async function photoUrl(visitId: string, path: string | null): Promise<string | null> {
  const local = await db.photos.get(visitId)
  if (local) return URL.createObjectURL(local.blob)
  if (!path) return null
  const hit = urlCache.get(path)
  if (hit && hit.exp > Date.now()) return hit.url
  const { data } = await supabase.storage.from('fotos').createSignedUrl(path, 3600)
  if (!data?.signedUrl) return null
  urlCache.set(path, { url: data.signedUrl, exp: Date.now() + 50 * 60_000 })
  return data.signedUrl
}
