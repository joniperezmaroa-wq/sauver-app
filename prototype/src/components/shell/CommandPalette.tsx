// Buscador universal (⌘K). BUSCAR = encontrar; la última opción lleva a PREGUNTAR.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Package, Search, Sparkles, Store, KanbanSquare, CornerDownLeft } from 'lucide-react'
import { CUSTOMERS } from '@/data/customers'
import { PRODUCTS, UNITS } from '@/data/catalog'
import { useApp } from '@/lib/store'
import { orderTotal, STATUS_LABEL } from '@/data/orders'
import { ars } from '@/lib/format'
import type { Role } from '@/data/people'
import { BASE } from './nav'
import { cn } from '@/lib/cn'

interface Result {
  id: string
  group: string
  title: string
  sub: string
  icon: typeof Search
  go: () => void
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function CommandPalette({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const nav = useNavigate()
  const { state } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const base = BASE[role]

  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const n = norm(q.trim())
    const close = (fn: () => void) => () => {
      fn()
      onClose()
    }
    const customers = CUSTOMERS.filter((c) => (role !== 'vendedor' || c.owner === 'Tomás') && (!n || norm(c.name).includes(n) || norm(c.zone).includes(n)))
      .slice(0, n ? 5 : 3)
      .map<Result>((c) => ({
        id: c.id, group: 'Clientes', title: c.name, sub: `${c.channel} · ${c.zone} · ${c.state}`, icon: Store,
        go: close(() => nav(`${base}/clientes/${c.id}`)),
      }))
    const orders = state.orders
      .filter((o) => {
        const c = CUSTOMERS.find((x) => x.id === o.customerId)
        return !n || norm(o.number).includes(n) || (c && norm(c.name).includes(n))
      })
      .slice(0, n ? 4 : 2)
      .map<Result>((o) => {
        const c = CUSTOMERS.find((x) => x.id === o.customerId)
        return {
          id: o.id, group: 'Pedidos', title: `${o.number} · ${c?.name ?? ''}`, sub: `${STATUS_LABEL[o.status]} · ${ars(orderTotal(o))}`,
          icon: KanbanSquare, go: close(() => nav(`${base}/pedidos?o=${o.id}`)),
        }
      })
    const products = PRODUCTS.filter((p) => n && norm(p.name).includes(n))
      .slice(0, 3)
      .map<Result>((p) => ({
        id: p.id, group: 'Productos', title: p.name, sub: `${p.pack} · ${UNITS[p.unit].name}`, icon: Package, go: close(() => undefined),
      }))
    const ask: Result[] = q.trim()
      ? [{
          id: 'ask', group: 'Preguntar', title: `Preguntale a Sauver: “${q.trim()}”`, sub: 'Analizar con datos y evidencia', icon: Sparkles,
          go: close(() => nav(`${base}/preguntar?q=${encodeURIComponent(q.trim())}`)),
        }]
      : []
    return [...customers, ...orders, ...products, ...ask]
  }, [q, state.orders, role, base, nav, onClose])

  useEffect(() => setIdx(0), [q])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIdx((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      results[idx]?.go()
    } else if (e.key === 'Escape') onClose()
  }

  let lastGroup = ''
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[max(12px,env(safe-area-inset-top))] md:pt-[12vh]">
          <motion.div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-float)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="text-muted" />
              <input
                ref={inputRef}
                id="palette-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Buscar cliente, pedido, producto…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
              />
              <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted md:block">esc</kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length === 0 && <div className="px-3 py-8 text-center text-[13px] text-muted">Sin resultados para “{q}”</div>}
              {results.map((r, i) => {
                const header = r.group !== lastGroup ? r.group : null
                lastGroup = r.group
                return (
                  <div key={r.id}>
                    {header && <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">{header}</div>}
                    <button
                      onMouseEnter={() => setIdx(i)}
                      onClick={r.go}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                        i === idx ? 'bg-surface-3' : '',
                        r.group === 'Preguntar' && 'text-accent-ink',
                      )}
                    >
                      <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', r.group === 'Preguntar' ? 'bg-accent-soft' : 'bg-surface-3 text-ink-2')}>
                        <r.icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{r.title}</span>
                        <span className="block truncate text-[12.5px] text-muted">{r.sub}</span>
                      </span>
                      {i === idx && <CornerDownLeft size={14} className="text-muted" />}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
