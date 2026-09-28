// Preguntale a Sauver — interfaz simulada. Las respuestas están armadas a mano (data/ask.ts).

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Ban, CircleSlash, FileText, Sparkles, TriangleAlert, Wrench } from 'lucide-react'
import { SUGGESTIONS, findAnswer, type Answer, type AnswerBlock } from '@/data/ask'
import type { Role } from '@/data/people'
import { DataTag, DataValue } from '@/components/ui/DataTag'
import { SalesChart } from '@/components/charts/SalesChart'
import { CashChart } from '@/components/charts/CashChart'
import { cn } from '@/lib/cn'

interface Turn {
  id: number
  q: string
  a: Answer
  phase: 'thinking' | 'tools' | 'done'
}

const SCOPE: Record<Role, string> = {
  gerencia: 'Acceso completo · solo métricas validadas',
  admin: 'Datos operativos: tareas, pedidos, cobranzas y Dux',
  vendedor: 'Tus clientes, pedidos, ventas y objetivos',
}

export function Preguntar({ role, compact = false }: { role: Role; compact?: boolean }) {
  const [params, setParams] = useSearchParams()
  const [turns, setTurns] = useState<Turn[]>([])
  const [q, setQ] = useState('')
  const seq = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)

  const ask = (text: string) => {
    const t = text.trim()
    if (!t) return
    const id = ++seq.current
    setTurns((ts) => [...ts, { id, q: t, a: findAnswer(role, t), phase: 'thinking' }])
    setQ('')
    window.setTimeout(() => setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, phase: 'tools' } : x))), 500)
    window.setTimeout(() => setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, phase: 'done' } : x))), 1400)
  }

  useEffect(() => {
    const initial = params.get('q')
    if (initial) {
      ask(initial)
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])

  const suggestions = SUGGESTIONS[role]

  return (
    <div className={cn('mx-auto flex w-full max-w-3xl flex-col', compact ? 'min-h-full' : 'min-h-[calc(100dvh-180px)]')}>
      {turns.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
          <div className="relative grid size-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-[0_8px_24px_-6px_color-mix(in_oklab,var(--accent)_60%,transparent)]">
            <Sparkles size={26} />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight">Preguntale a Sauver</h2>
            <p className="mx-auto mt-1 max-w-md text-[14px] text-muted">
              Responde con números de Dux y SAUVER, muestra la evidencia y avisa cuando los datos no alcanzan. Nunca inventa.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1 text-[12px] text-ink-2">{SCOPE[role]}</p>
          </div>
          <div className="grid w-full gap-2 @xl:grid-cols-2">
            {suggestions.map((s) => (
              <button
                key={s.q}
                onClick={() => ask(s.q)}
                className="rounded-2xl border border-line bg-surface px-4 py-3 text-left text-[14px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                {s.q}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-muted">Prototipo: las respuestas están simuladas con datos ficticios.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 pb-4">
          {turns.map((t) => (
            <div key={t.id} className="flex flex-col gap-3">
              <div className="self-end rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[14px] text-bg">{t.q}</div>
              <TurnView turn={t} role={role} />
            </div>
          ))}
          {turns[turns.length - 1]?.phase === 'done' && (
            <div className="flex flex-wrap gap-2">
              {suggestions
                .filter((s) => !turns.some((t) => t.q === s.q))
                .slice(0, 3)
                .map((s) => (
                  <button key={s.q} onClick={() => ask(s.q)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 hover:border-line-strong">
                    {s.q}
                  </button>
                ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(q)
        }}
        className="sticky bottom-3 mt-2 flex items-center gap-2 rounded-2xl border border-line-strong bg-surface p-1.5 pl-4 shadow-[var(--shadow-float)]"
      >
        <input
          id="ask-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Preguntá algo sobre el negocio…"
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={!q.trim()} className="grid size-10 place-items-center rounded-xl bg-accent text-on-accent disabled:opacity-30" aria-label="Preguntar">
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  )
}

function TurnView({ turn, role }: { turn: Turn; role: Role }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
        <Sparkles size={16} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {turn.a.tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {turn.a.tools.map((tool, i) => (
              <motion.span
                key={tool}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: turn.phase === 'thinking' ? 0 : 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-1 font-mono text-[11px] text-ink-2"
              >
                <Wrench size={11} />
                {tool}
              </motion.span>
            ))}
          </div>
        )}
        <AnimatePresence mode="wait">
          {turn.phase !== 'done' ? (
            <motion.div key="loading" exit={{ opacity: 0 }} className="flex items-center gap-2 text-[13px] text-muted">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1.5 rounded-full bg-muted"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
              {turn.phase === 'thinking' ? 'Eligiendo qué datos consultar…' : 'Consultando datos validados…'}
            </motion.div>
          ) : (
            <motion.div key="answer" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
              {turn.a.blocks.map((b, i) => (
                <Block key={i} block={b} role={role} />
              ))}
              {turn.a.evidence.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-line pt-2.5">
                  <span className="text-[11px] font-medium tracking-wide text-muted uppercase">Evidencia</span>
                  {turn.a.evidence.map((e) => (
                    <span key={e} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2">
                      <FileText size={13} className="text-muted" />
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Block({ block, role }: { block: AnswerBlock; role: Role }) {
  switch (block.type) {
    case 'text':
      return <p className="text-[15px] leading-relaxed text-ink">{block.text}</p>
    case 'numbers':
      return (
        <div className="grid grid-cols-1 gap-2 @xl:grid-cols-2">
          {block.items.map((n) => (
            <div key={n.label} className="rounded-2xl border border-line bg-surface px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] text-muted">{n.label}</span>
                <DataTag kind={n.kind} />
              </div>
              <div className="mt-1 text-[22px] font-semibold tracking-tight">
                <DataValue kind={n.kind}>{n.value.replace(/^≈ /, '')}</DataValue>
              </div>
              {n.sub && <div className="text-[12px] text-muted">{n.sub}</div>}
            </div>
          ))}
        </div>
      )
    case 'chart':
      return (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface py-3">
          {block.chart === 'sales-vs-be' ? <SalesChart height={200} compact={role !== 'gerencia'} /> : <CashChart horizon={60} history={14} height={210} showBand={false} />}
        </div>
      )
    case 'list':
      return (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-4 py-2 text-[12px] font-medium text-muted">{block.title}</div>
          {block.rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 last:border-0">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium">{r.label}</div>
                {r.sub && <div className="truncate text-[12px] text-muted">{r.sub}</div>}
              </div>
              <span className="num shrink-0 text-[14px] font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      )
    case 'warning':
      return (
        <div className="flex gap-2.5 rounded-2xl bg-prov-soft px-4 py-3 text-[13.5px] text-ink-2">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-prov" />
          {block.text}
        </div>
      )
    case 'insufficient':
      return (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface-2 px-4 py-3.5">
          <div className="flex items-center gap-2 text-[14.5px] font-semibold">
            <CircleSlash size={17} className="text-prov" />
            {block.text}
          </div>
          <div className="mt-2 text-[12.5px] text-muted">Falta:</div>
          <ul className="mt-1 flex flex-col gap-1">
            {block.missing.map((m) => (
              <li key={m} className="flex gap-2 text-[13.5px] text-ink-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-prov" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )
    case 'denied':
      return (
        <div className="flex gap-2.5 rounded-2xl bg-surface-3 px-4 py-3 text-[14px] text-ink-2">
          <Ban size={17} className="mt-0.5 shrink-0 text-muted" />
          {block.text}
        </div>
      )
  }
}
