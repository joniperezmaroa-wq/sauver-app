import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, CalendarClock, Check, ChevronRight, ClipboardCopy, MessageCircle, StickyNote } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge, SEVERITY } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { useApp } from '@/lib/store'
import { bucketOf, CHECKLIST_HISTORY, CLOSING, DAILY_CHECKLIST, type Task, type TaskBucket } from '@/data/admin'
import { ALERTS, DUX_COVERAGE, PAYABLE_LIST, RECEIVABLES } from '@/data/finance'
import { customer } from '@/data/customers'
import { orderTotal } from '@/data/orders'
import { TODAY, addDays, relativeDay } from '@/lib/dates'
import { arsCompact, ddmm, longDate, weekdayShort } from '@/lib/format'
import { cn } from '@/lib/cn'
import { copyForDux } from '@/features/pedidos/orderText'

export function AdminHoy() {
  const { state, dispatch, toast } = useApp()
  const nav = useNavigate()
  const [bucket, setBucket] = useState<TaskBucket>('hoy')
  const [open, setOpen] = useState<string | null>(null)

  const tasks = state.tasks
  const count = (b: TaskBucket) => tasks.filter((t) => bucketOf(t) === b && !t.done).length
  const visible = tasks.filter((t) => bucketOf(t) === bucket).sort((a, b) => Number(!!a.done) - Number(!!b.done))
  const checklistDone = DAILY_CHECKLIST.filter((c) => state.checklist[c.id]).length
  const newOrders = state.orders.filter((o) => o.status === 'enviado')
  const weekReceivables = RECEIVABLES.filter((r) => r.expected <= addDays(TODAY, 7))
  const weekPayables = PAYABLE_LIST.filter((p) => p.date <= addDays(TODAY, 7))
  const closingDone = CLOSING.items.filter((i) => i.done).length
  const adminAlerts = ALERTS.filter((a) => a.audience.includes('admin'))
  const duxIssues = DUX_COVERAGE.flatMap((s) => s.rows.map((r) => ({ ...r, source: s.source }))).filter((r) => r.status !== 'ok')

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">{longDate(TODAY)}</p>
          <h2 className="mt-0.5 text-[24px] leading-tight font-semibold tracking-[-0.02em] md:text-[28px]">¿Qué hay que hacer hoy, Carla?</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="crit">{count('vencida')} vencidas</Badge>
          <Badge tone="accent">{count('hoy')} para hoy</Badge>
          <Badge tone="info">{newOrders.length} pedidos nuevos</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Control diario: confirma el circuito WhatsApp → Dux sin cargar nada dos veces */}
          <Card>
            <CardHeader
              title="Control diario"
              sub="WhatsApp → carga en Dux → SAUVER lo recibe por importación"
              action={
                <ProgressRing value={checklistDone} max={DAILY_CHECKLIST.length} size={44} stroke={5} tone={checklistDone === DAILY_CHECKLIST.length ? 'good' : 'accent'}>
                  <span className="num text-[12px] font-semibold">
                    {checklistDone}/{DAILY_CHECKLIST.length}
                  </span>
                </ProgressRing>
              }
            />
            <div className="grid grid-cols-1 gap-2 px-4 pt-3 pb-4 sm:grid-cols-2 md:grid-cols-3">
              {DAILY_CHECKLIST.map((c) => {
                const on = !!state.checklist[c.id]
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      dispatch({ type: 'checklist/toggle', id: c.id })
                      if (!on && checklistDone + 1 === DAILY_CHECKLIST.length) toast({ title: 'Día conciliado', body: 'El control de hoy quedó completo.' })
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                      on ? 'border-transparent bg-accent-soft' : 'border-line hover:border-line-strong',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors',
                        on ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
                      )}
                    >
                      <AnimatePresence>
                        {on && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check size={14} strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-[13.5px] font-medium', on && 'text-accent-ink')}>{c.label}</span>
                      <span className="block truncate text-[11.5px] text-muted">{c.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3 text-[12.5px] text-muted">
              <span>Días anteriores</span>
              <div className="flex gap-1.5">
                {CHECKLIST_HISTORY.map((h) => (
                  <span
                    key={h.date.toISOString()}
                    title={`${ddmm(h.date)}: ${h.done}/6`}
                    className={cn(
                      'num inline-flex h-6 items-center rounded-md px-1.5 text-[11px] font-medium',
                      h.done === 6 ? 'bg-good-soft text-good-ink' : 'bg-warn-soft text-warn-ink',
                    )}
                  >
                    {weekdayShort(h.date)} {h.done === 6 ? '✓' : `${h.done}/6`}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Timeline de tareas */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
              <h3 className="text-[15px] font-semibold">Tareas</h3>
              <Segmented
                size="sm"
                value={bucket}
                onChange={(b) => {
                  setBucket(b)
                  setOpen(null)
                }}
                options={[
                  { value: 'vencida', label: 'Vencidas', count: count('vencida') },
                  { value: 'hoy', label: 'Hoy', count: count('hoy') },
                  { value: 'semana', label: '7 días', count: count('semana') },
                  { value: 'mes', label: 'Mes', count: count('mes') },
                ]}
              />
            </div>
            <div className="flex flex-col px-3 pt-2 pb-3">
              {visible.length === 0 && <p className="px-2 py-8 text-center text-[13.5px] text-muted">Nada pendiente en este tramo.</p>}
              {visible.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  open={open === t.id}
                  onToggleOpen={() => setOpen(open === t.id ? null : t.id)}
                  onGo={t.shortcut ? () => nav(`/a/${t.shortcut}`) : undefined}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* Pedidos nuevos */}
          <Card>
            <CardHeader
              title="Pedidos nuevos"
              action={
                <button onClick={() => nav('/a/pedidos')} className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline">
                  Tablero <ChevronRight size={14} />
                </button>
              }
            />
            <div className="flex flex-col gap-2 p-3">
              {newOrders.length === 0 && <p className="px-2 py-4 text-[13px] text-muted">No hay pedidos sin revisar.</p>}
              {newOrders.map((o) => {
                const c = customer(o.customerId)
                return (
                  <div key={o.id} className={cn('rounded-xl border p-3', o.isNew ? 'border-accent bg-accent-soft/40' : 'border-line')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium">{c.name}</div>
                        <div className="text-[12px] text-muted">
                          {o.number} · {o.seller} · {o.createdAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="num text-[14px] font-semibold">{arsCompact(orderTotal(o))}</span>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => nav(`/a/pedidos?o=${o.id}`)}>
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyForDux(o).then((ok) =>
                            toast({ title: ok ? 'Copiado para Dux' : 'Texto listo para copiar', body: ok ? 'Pegalo en el presupuesto de Dux.' : 'Abrí el pedido para copiarlo.' }),
                          )
                        }
                      >
                        <ClipboardCopy size={14} /> Copiar para Dux
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Cobranzas */}
          <Card>
            <CardHeader title="Cobranzas · 7 días" action={<span className="num text-[14px] font-semibold">{arsCompact(weekReceivables.reduce((s, r) => s + r.amount, 0))}</span>} />
            <div className="flex flex-col px-3 pt-2 pb-3">
              {weekReceivables.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-[11px] text-muted uppercase">{weekdayShort(r.expected)}</div>
                    <div className="num text-[15px] leading-none font-semibold">{r.expected.getDate()}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{customer(r.customerId).name}</div>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted">
                      {r.state === 'vencido' ? <span className="text-crit-ink">Vencido</span> : r.state === 'parcial' ? 'Cobro parcial' : 'Vence'}
                      {r.committed && <span>· comprometido</span>}
                    </div>
                  </div>
                  <span className="num text-[13.5px] font-medium">{arsCompact(r.amount)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Pagos */}
          <Card>
            <CardHeader title="Pagos · 7 días" action={<span className="num text-[14px] font-semibold">{arsCompact(weekPayables.reduce((s, p) => s + p.amount, 0))}</span>} />
            <div className="flex flex-col px-3 pt-2 pb-3">
              {weekPayables.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-[11px] text-muted uppercase">{weekdayShort(p.date)}</div>
                    <div className="num text-[15px] leading-none font-semibold">{p.date.getDate()}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{p.concept}</div>
                    <div className="text-[12px] text-muted">
                      {p.supplier} · {p.certainty}
                    </div>
                  </div>
                  <span className="num text-[13.5px] font-medium">{arsCompact(p.amount)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Datos Dux + cierre */}
          <Card>
            <CardHeader title="Datos Dux" sub="Al 26/09" action={<Badge tone="warn">{duxIssues.length} a revisar</Badge>} />
            <div className="flex flex-col gap-1 px-5 pt-2 pb-4">
              {duxIssues.map((r) => (
                <button key={r.source + r.report} onClick={() => nav('/a/datos')} className="flex items-center justify-between py-1.5 text-left text-[13px]">
                  <span className="text-ink-2">
                    {r.report} <span className="text-muted">· {r.source.replace('Dux ', '')}</span>
                  </span>
                  <span className={cn('text-[12px]', r.status === 'falta' ? 'text-crit-ink' : 'text-warn-ink')}>{r.note}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={`Cierre de ${CLOSING.period.toLowerCase()}`} sub={`${closingDone} de ${CLOSING.items.length} ítems`} />
            <div className="flex flex-col gap-3 px-5 pt-3 pb-4">
              <ProgressBar value={closingDone} max={CLOSING.items.length} />
              <div className="flex flex-col gap-1.5">
                {CLOSING.items
                  .filter((i) => !i.done)
                  .map((i) => (
                    <div key={i.label} className="flex items-center justify-between text-[13px]">
                      <span className="inline-flex items-center gap-2 text-ink-2">
                        <span className="size-1.5 rounded-full bg-warn" />
                        {i.label}
                      </span>
                      <span className="text-[12px] text-muted">{i.note}</span>
                    </div>
                  ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Alertas operativas" />
            <div className="flex flex-col gap-1 p-3">
              {adminAlerts.map((a) => {
                const s = SEVERITY[a.severity]
                return (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg p-2">
                    <s.Icon size={16} className={cn('mt-0.5 shrink-0', `text-${s.tone}-ink`)} />
                    <div className="min-w-0">
                      <div className="text-[13px] leading-snug font-medium">{a.title}</div>
                      <div className="text-[12px] text-muted">{a.detail}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task, open, onToggleOpen, onGo }: { task: Task; open: boolean; onToggleOpen: () => void; onGo?: () => void }) {
  const { dispatch, toast } = useApp()
  const [note, setNote] = useState(task.note ?? '')
  const overdue = bucketOf(task) === 'vencida'
  return (
    <motion.div layout className={cn('rounded-xl transition-colors', open && 'bg-surface-2')}>
      <div className="flex items-center gap-3 px-2 py-2.5">
        <button
          onClick={() => {
            dispatch({ type: 'task/toggle', id: task.id })
            if (!task.done)
              toast({
                title: 'Tarea completada',
                body: task.title,
                action: { label: 'Deshacer', onClick: () => dispatch({ type: 'task/toggle', id: task.id }) },
              })
          }}
          aria-label={task.done ? 'Marcar como pendiente' : 'Completar'}
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
            task.done ? 'border-accent bg-accent text-on-accent' : 'border-line-strong hover:border-accent',
          )}
        >
          {task.done && <Check size={13} strokeWidth={3} />}
        </button>
        <button onClick={onToggleOpen} className="min-w-0 flex-1 text-left">
          <div className={cn('text-[14px] leading-snug font-medium', task.done && 'text-muted line-through')}>{task.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
            <span className={cn(overdue && !task.done && 'font-medium text-crit-ink')}>{relativeDay(task.due)}</span>
            <span>·</span>
            <span>{task.origin}</span>
            {task.detail && (
              <>
                <span className="hidden sm:inline">·</span>
                <span className="hidden truncate sm:inline">{task.detail}</span>
              </>
            )}
            {task.escalated && <Badge tone="accent" className="h-5">Escalada</Badge>}
            {task.note && <StickyNote size={12} className="text-muted" />}
          </div>
        </button>
        {onGo && !task.done && (
          <button onClick={onGo} className="hidden items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-medium text-accent-ink hover:bg-accent-soft sm:inline-flex">
            Ir <ArrowUpRight size={13} />
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-3 px-2 pb-3 pl-11">
              {task.detail && <p className="text-[13px] text-ink-2 sm:hidden">{task.detail}</p>}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    dispatch({ type: 'task/snooze', id: task.id })
                    toast({ title: 'Pospuesta para mañana' })
                  }}
                >
                  <CalendarClock size={14} /> Posponer
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={task.escalated}
                  onClick={() => {
                    dispatch({ type: 'task/escalate', id: task.id })
                    toast({ title: 'Escalada a Gerencia', body: 'Joni la ve en Decisiones con este contexto.' })
                  }}
                >
                  <ArrowUpRight size={14} /> Escalar a Gerencia
                </Button>
                {onGo && (
                  <Button size="sm" variant="soft" onClick={onGo}>
                    Resolver <ChevronRight size={14} />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  id={`note-${task.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Agregar una nota…"
                  className="h-9 min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 text-[13px] outline-none focus:border-accent"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9"
                  disabled={!note.trim()}
                  onClick={() => {
                    dispatch({ type: 'task/note', id: task.id, note })
                    toast({ title: 'Nota guardada' })
                  }}
                >
                  <MessageCircle size={14} /> Guardar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

