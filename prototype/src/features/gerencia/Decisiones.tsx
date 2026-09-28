import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Scale } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApp } from '@/lib/store'
import { relativeDay } from '@/lib/dates'
import { cn } from '@/lib/cn'

export function Decisiones() {
  const { state, dispatch, toast } = useApp()
  const [choice, setChoice] = useState<Record<string, number>>({})
  const pending = state.decisions.filter((d) => d.status === 'pendiente')
  const done = state.decisions.filter((d) => d.status === 'decidida')

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight">Decisiones pendientes</h2>
        <p className="mt-1 text-[14px] text-muted">
          Lo que Administración o el sistema escalaron para que decidas, con el contexto y los datos para hacerlo sin buscar.
        </p>
      </div>

      {pending.length === 0 && (
        <Card>
          <EmptyState icon={<Check size={24} />} title="No hay decisiones pendientes" body="Cuando algo requiera tu criterio va a aparecer acá con sus datos y alternativas." />
        </Card>
      )}

      {pending.map((d) => (
        <motion.div key={d.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                  <Scale size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-semibold">{d.title}</h3>
                    <Badge tone={d.impact === 'alta' ? 'serious' : 'warn'}>Impacto {d.impact}</Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted">
                    Escalada por {d.raisedBy} · {relativeDay(d.raisedAt).toLowerCase()}
                  </p>
                </div>
              </div>
              <p className="text-[14px] leading-relaxed text-ink-2">{d.context}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {d.data.map((x) => (
                  <div key={x.label} className="rounded-xl bg-surface-2 px-3 py-2.5">
                    <div className="text-[11.5px] text-muted">{x.label}</div>
                    <div className="num text-[15px] font-semibold">{x.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[12px] font-medium tracking-wide text-muted uppercase">Alternativas</div>
                {d.options.map((o, i) => (
                  <button
                    key={o}
                    onClick={() => setChoice({ ...choice, [d.id]: i })}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-[14px] transition-colors',
                      choice[d.id] === i ? 'border-accent bg-accent-soft font-medium' : 'border-line hover:border-line-strong',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-full border-2',
                        choice[d.id] === i ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
                      )}
                    >
                      {choice[d.id] === i && <Check size={12} strokeWidth={3} />}
                    </span>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3">
              <Button variant="ghost" size="md" onClick={() => toast({ title: 'Pedido de más información enviado a Carla', tone: 'info' })}>
                Pedir más datos
              </Button>
              <Button
                variant="primary"
                disabled={choice[d.id] == null}
                onClick={() => {
                  dispatch({ type: 'decision/decide', id: d.id })
                  toast({ title: 'Decisión registrada', body: `${d.options[choice[d.id]]} · Carla recibe el aviso.` })
                }}
              >
                Decidir
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}

      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[12px] font-medium tracking-wide text-muted uppercase">Decididas</div>
          {done.map((d) => (
            <Card key={d.id} className="flex items-center gap-3 px-4 py-3">
              <Check size={16} className="text-good-ink" />
              <span className="flex-1 text-[14px]">{d.title}</span>
              <Badge tone="good">Decidida hoy</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
