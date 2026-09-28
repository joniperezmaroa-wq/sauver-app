import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, UserPlus } from 'lucide-react'
import { CUSTOMERS, repurchaseDelay, type Customer, type LifecycleState } from '@/data/customers'
import type { Role } from '@/data/people'
import { Photo } from '@/components/ui/Photo'
import { Badge, type Tone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { arsCompact } from '@/lib/format'
import { BASE } from '@/components/shell/nav'
import { cn } from '@/lib/cn'
import { useApp } from '@/lib/store'

export const STATE_TONE: Record<LifecycleState, Tone> = {
  Prospecto: 'info',
  Nuevo: 'accent',
  Activo: 'good',
  'En riesgo': 'warn',
  Inactivo: 'neutral',
}

export function RepurchaseChip({ c }: { c: Customer }) {
  const d = repurchaseDelay(c)
  if (d == null || c.state === 'Inactivo') return null
  if (d > 0) return <Badge tone={d > 10 ? 'serious' : 'warn'}>Demorado {d} d</Badge>
  if (d >= -3) return <Badge tone="info">Recompra en {-d} d</Badge>
  return null
}

export function Clientes({ role }: { role: Role }) {
  const { toast } = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'todos' | LifecycleState | 'recompra'>('todos')
  const mine = role === 'vendedor'
  const base = BASE[role]

  const list = useMemo(() => {
    return CUSTOMERS.filter((c) => (!mine || c.owner === 'Tomás'))
      .filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.zone.toLowerCase().includes(q.toLowerCase()))
      .filter((c) => {
        if (filter === 'todos') return true
        if (filter === 'recompra') return (repurchaseDelay(c) ?? -99) >= -3 && c.state !== 'Inactivo'
        return c.state === filter
      })
  }, [q, filter, mine])

  const filters: { v: typeof filter; label: string }[] = [
    { v: 'todos', label: 'Todos' },
    { v: 'recompra', label: 'Para recompra' },
    { v: 'Activo', label: 'Activos' },
    { v: 'En riesgo', label: 'En riesgo' },
    { v: 'Nuevo', label: 'Nuevos' },
    { v: 'Prospecto', label: 'Prospectos' },
    { v: 'Inactivo', label: 'Inactivos' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {!mine && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight">Clientes</h2>
            <p className="text-[13.5px] text-muted">Cartera comercial · datos fiscales desde Dux, historia comercial desde SAUVER</p>
          </div>
          <Button variant="primary" onClick={() => toast({ title: 'Alta de prospecto', body: 'En el prototipo está en el flujo del vendedor.', tone: 'info' })}>
            <UserPlus size={16} /> Nuevo prospecto
          </Button>
        </div>
      )}
      <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5">
        <Search size={17} className="text-muted" />
        <input
          id="clients-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o zona"
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
      </label>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none @3xl:mx-0 @3xl:px-0">
        {filters.map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={cn(
              'h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium transition-colors',
              filter === f.v ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={cn('grid gap-3', mine ? 'grid-cols-1' : 'grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3')}>
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
            <Link to={`${base}/clientes/${c.id}`} className="flex gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-line-strong">
              <Photo tone={c.photoTone} className="size-[72px] shrink-0 rounded-xl" showExample={false} />
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px] font-semibold">{c.name}</div>
                    <div className="truncate text-[12.5px] text-muted">
                      {c.channel} · {c.zone}
                    </div>
                  </div>
                  <Badge tone={STATE_TONE[c.state]}>{c.state}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-2">
                  {c.lastPurchaseDaysAgo != null ? <span>Última compra hace {c.lastPurchaseDaysAgo} d</span> : <span className="text-muted">Sin compras</span>}
                  {c.overdue > 0 && <span className="num font-medium text-crit-ink">{arsCompact(c.overdue)} vencido</span>}
                  <RepurchaseChip c={c} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-[13.5px] text-muted">Ningún cliente coincide con el filtro.</p>}
    </div>
  )
}
