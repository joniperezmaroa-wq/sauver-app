import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search, Store } from 'lucide-react'
import { db } from '@/lib/db'
import { useMe } from '@/lib/auth'
import { useProfiles } from '@/lib/data'
import { Badge, type Tone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { arsCompact } from '@/lib/format'
import { daysBetween } from '@/lib/dates'
import type { CustomerStatus } from '@/lib/types'
import { cn } from '@/lib/cn'

export const STATUS_TONE: Record<CustomerStatus, Tone> = { prospecto: 'info', activo: 'good', inactivo: 'neutral' }
export const STATUS_TEXT: Record<CustomerStatus, string> = { prospecto: 'Prospecto', activo: 'Activo', inactivo: 'Inactivo' }

export function Clientes({ base }: { base: string }) {
  const me = useMe()
  const nav = useNavigate()
  const seller = me.role === 'vendedor'
  const profiles = useProfiles()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'todos' | CustomerStatus | 'saldo'>('todos')
  const [owner, setOwner] = useState<string>('todos')

  const rows = useLiveQuery(async () => {
    const [customers, balances, visits] = await Promise.all([
      seller ? db.customers.where('owner_id').equals(me.id).toArray() : db.customers.toArray(),
      db.balances.toArray(),
      db.visits.toArray(),
    ])
    const bal = new Map(balances.map((b) => [b.customer_id, b]))
    const last = new Map<string, string>()
    for (const v of visits) if (!last.get(v.customer_id) || v.visited_at > last.get(v.customer_id)!) last.set(v.customer_id, v.visited_at)
    return customers
      .map((c) => ({ c, bal: bal.get(c.id), lastVisit: last.get(c.id) }))
      .sort((a, b) => a.c.name.localeCompare(b.c.name))
  }, [seller, me.id])

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const list = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => !q || norm(`${r.c.name} ${r.c.zone ?? ''} ${r.c.address ?? ''} ${r.c.cuit ?? ''}`).includes(norm(q)))
        .filter((r) => owner === 'todos' || r.c.owner_id === owner)
        .filter((r) => (filter === 'todos' ? true : filter === 'saldo' ? Number(r.bal?.balance ?? 0) > 0 : r.c.status === filter)),
    [rows, q, filter, owner],
  )
  const owners = [...new Set((rows ?? []).map((r) => r.c.owner_id))]

  if (!rows) return null

  return (
    <div className={cn('flex flex-col gap-4', seller && 'px-4 pt-4 pb-8')}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={cn('font-semibold tracking-tight', seller ? 'text-[24px]' : 'text-[22px]')}>{seller ? 'Mis clientes' : 'Clientes'}</h2>
          <p className="text-[13.5px] text-muted">{rows.length} en total</p>
        </div>
        <Button variant="primary" onClick={() => nav(`${base}/clientes/nuevo`)}>
          <Plus size={16} /> Nuevo
        </Button>
      </div>
      <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5">
        <Search size={17} className="text-muted" />
        <input id="clients-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, zona, dirección o CUIT" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
      </label>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none @3xl:mx-0 @3xl:px-0">
        {([
          ['todos', 'Todos'],
          ['activo', 'Activos'],
          ['prospecto', 'Prospectos'],
          ['saldo', 'Con saldo'],
          ['inactivo', 'Inactivos'],
        ] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={cn('h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium', filter === v ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink-2')}
          >
            {label}
          </button>
        ))}
        {!seller && owners.length > 1 && (
          <select id="owner-filter" value={owner} onChange={(e) => setOwner(e.target.value)} className="h-8 shrink-0 rounded-full border border-line bg-surface px-3 text-[13px]">
            <option value="todos">Todos los responsables</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {profiles.get(o)?.full_name || 'Sin nombre'}
              </option>
            ))}
          </select>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[20px] border border-line bg-surface">
          <EmptyState icon={<Store size={24} />} title="Todavía no hay clientes" body={seller ? 'Se crean al registrar una visita a un comercio nuevo, o con el botón Nuevo.' : 'El vendedor los va cargando desde la calle.'} />
        </div>
      ) : (
        <div className={cn('grid gap-2', !seller && '@2xl:grid-cols-2 @5xl:grid-cols-3')}>
          {list.map(({ c, bal, lastVisit }) => (
            <Link key={c.id} to={`${base}/clientes/${c.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-line-strong">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-3 text-[15px] font-semibold text-ink-2">{c.name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14.5px] font-semibold">{c.name}</span>
                  {c._pending && <Badge tone="warn">Por enviar</Badge>}
                </div>
                <div className="truncate text-[12.5px] text-muted">
                  {c.channel}
                  {c.zone ? ` · ${c.zone}` : ''}
                  {!seller && profiles.get(c.owner_id) ? ` · ${profiles.get(c.owner_id)!.full_name}` : ''}
                </div>
                <div className="flex flex-wrap gap-x-3 text-[12px] text-ink-2">
                  {lastVisit ? <span>Visita hace {daysBetween(new Date(lastVisit), new Date())} d</span> : <span className="text-muted">Sin visitas</span>}
                  {Number(bal?.balance ?? 0) > 0 && <span className="num">Saldo {arsCompact(Number(bal!.balance))}</span>}
                  {Number(bal?.overdue ?? 0) > 0 && <span className="num font-medium text-crit-ink">{arsCompact(Number(bal!.overdue))} vencido</span>}
                </div>
              </div>
              <Badge tone={STATUS_TONE[c.status]}>{STATUS_TEXT[c.status]}</Badge>
            </Link>
          ))}
          {list.length === 0 && <p className="py-8 text-center text-[13.5px] text-muted">Ningún cliente coincide.</p>}
        </div>
      )}
    </div>
  )
}
