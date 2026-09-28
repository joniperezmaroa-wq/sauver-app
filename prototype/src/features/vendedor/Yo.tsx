import { SELLER_GOALS, WEEK_DAYS } from '@/data/seller'
import { ProgressBar } from '@/components/ui/Progress'
import { DataTag } from '@/components/ui/DataTag'
import { ThemeSwitch, RoleSwitcher } from '@/components/shell/AppShell'
import { ars, arsCompact, weekdayShort } from '@/lib/format'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/cn'

export function VendedorYo() {
  const g = SELLER_GOALS
  const { state } = useApp()
  const commission = g.commission.fixed + g.commission.variable
  const goals = [
    { label: 'Visitas', done: g.visits.done + state.visitsToday, target: g.visits.target, fmt: String },
    { label: 'Clientes nuevos', done: g.newCustomers.done, target: g.newCustomers.target, fmt: String },
    { label: 'Días en calle', done: g.streetDays.done, target: g.streetDays.target, fmt: String },
    { label: 'Ventas', done: g.sales.done, target: g.sales.target, fmt: arsCompact },
  ]
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-ink text-[22px] font-semibold text-bg">T</span>
        <div>
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">Tomás</h1>
          <p className="text-[13px] text-muted">Vendedor · piloto de 90 días · día 41</p>
        </div>
      </div>

      <section className="rounded-[20px] border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Objetivos · {g.period.toLowerCase()}</h2>
          <span className="text-[12.5px] text-muted">Conversión {g.conversion} %</span>
        </div>
        <div className="flex flex-col gap-3.5">
          {goals.map((x) => (
            <div key={x.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13.5px]">
                <span className="text-ink-2">{x.label}</span>
                <span className="num font-medium">
                  {x.fmt(x.done)} <span className="text-muted">/ {x.fmt(x.target)}</span>
                </span>
              </div>
              <ProgressBar value={x.done} max={x.target} tone={x.done >= x.target ? 'good' : 'accent'} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between gap-1 border-t border-line pt-3">
          {WEEK_DAYS.map((d) => (
            <div key={d.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  'num grid size-9 place-items-center rounded-xl text-[13px] font-semibold',
                  d.street ? 'bg-accent-soft text-accent-ink' : 'bg-surface-3 text-muted',
                )}
              >
                {d.visits || '·'}
              </span>
              <span className="text-[11px] text-muted">{weekdayShort(d.date)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-line bg-surface p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Mi comisión de septiembre</h2>
          <DataTag kind="proyectado">Estimada</DataTag>
        </div>
        <div className="num text-[30px] font-semibold tracking-tight">{ars(commission)}</div>
        <div className="mt-3 flex flex-col gap-2 text-[13.5px]">
          <div className="flex justify-between">
            <span className="text-ink-2">Fijo</span>
            <span className="num">{ars(g.commission.fixed)}</span>
          </div>
          {g.commission.detail.map((d) => (
            <div key={d.label} className="flex justify-between">
              <span className="text-ink-2">{d.label}</span>
              <span className="num">{ars(d.amount)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-muted">Se calcula sobre lo facturado. Solo ves tu comisión; los costos y la rentabilidad de Sauver no se muestran en esta vista.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-4">
        <h2 className="text-[15px] font-semibold">Prototipo</h2>
        <RoleSwitcher role="vendedor" />
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-[13px] text-muted">Tema</span>
          <ThemeSwitch />
        </div>
      </section>
    </div>
  )
}
