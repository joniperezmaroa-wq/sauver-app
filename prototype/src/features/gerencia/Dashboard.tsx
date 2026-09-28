import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, ChevronRight, Lightbulb, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { KpiHero, KpiMini, Delta } from '@/components/ui/Kpi'
import { DataTag, DataLegend, DataValue } from '@/components/ui/DataTag'
import { Badge, SEVERITY } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Progress'
import { Segmented } from '@/components/ui/Segmented'
import { Sparkline } from '@/components/ui/Sparkline'
import { DrillSheet } from '@/components/ui/DrillSheet'
import { SalesChart } from '@/components/charts/SalesChart'
import { CashChart } from '@/components/charts/CashChart'
import { AGING, PAYABLES, INSIGHTS, KPI, MONTHLY, SAFETY_MARGIN, ALERTS, COST_CONFIDENCE, DRILL_GASTOS, DRILL_VENTAS, CURRENT, PREV } from '@/data/finance'
import { CUSTOMERS, repurchaseDelay } from '@/data/customers'
import { PRODUCTS } from '@/data/catalog'
import { SELLER_GOALS } from '@/data/seller'
import { useApp } from '@/lib/store'
import { arsCompact, ars, pct, unitsCompact, longDate, int } from '@/lib/format'
import { TODAY } from '@/lib/dates'
import { cn } from '@/lib/cn'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export function GerenciaDashboard() {
  const nav = useNavigate()
  const { state, toast } = useApp()
  const [period, setPeriod] = useState('mes')
  const [horizon, setHorizon] = useState('90')
  const [drill, setDrill] = useState<'ventas' | 'gastos' | null>(null)

  const beRatio = (KPI.salesProj / KPI.breakEven) * 100
  const pendingDecisions = state.decisions.filter((d) => d.status === 'pendiente')
  const gerAlerts = ALERTS.filter((a) => a.audience.includes('gerencia'))
  const late = CUSTOMERS.filter((c) => (repurchaseDelay(c) ?? 0) > 5 && c.state !== 'Inactivo')
  const receivablesTotal = AGING.reduce((s, a) => s + a.amount, 0)
  const payablesTotal = PAYABLES.reduce((s, a) => s + a.amount, 0)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5 md:gap-6">
      {/* Encabezado */}
      <motion.div variants={rise} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">{longDate(TODAY)}</p>
          <h2 className="mt-0.5 text-[24px] leading-tight font-semibold tracking-[-0.02em] md:text-[28px]">Buen día, Joni</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            value={period}
            onChange={(v) => {
              setPeriod(v)
              if (v !== 'mes') toast({ title: 'Filtro de período', body: 'En el prototipo los números están armados para el mes en curso.', tone: 'info' })
            }}
            options={[
              { value: 'mes', label: 'Mes' },
              { value: '3m', label: '3M' },
              { value: '6m', label: '6M' },
              { value: '12m', label: '12M' },
              { value: 'ytd', label: 'Año' },
            ]}
          />
          <span className="hidden text-[12.5px] text-muted sm:inline">vs agosto</span>
        </div>
      </motion.div>

      {/* Frase-estado */}
      <motion.div variants={rise}>
        <Card className="relative overflow-hidden p-5 md:p-6">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60"
            style={{ background: 'radial-gradient(ellipse at 100% 0%, var(--accent-soft), transparent 70%)' }}
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-3xl text-[17px] leading-snug font-medium text-ink md:text-[19px]">
              Septiembre viene <span className="text-accent-ink">{pct(beRatio - 100)} sobre el punto de equilibrio</span>. La caja se mantiene sobre
              el mínimo; el día más ajustado es el <span className="whitespace-nowrap">14/10</span>, con ≈ {arsCompact(KPI.cashValley)}.
            </p>
            <div className="flex shrink-0 flex-col items-start gap-1.5 md:items-end">
              <DataLegend />
              <span className="text-[12px] text-muted">
                Costos validados: <span className="num font-medium text-prov">{COST_CONFIDENCE} %</span> de las ventas
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Héroes */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <KpiHero
          label="Resultado del mes"
          kind="provisional"
          value={arsCompact(KPI.resultProj)}
          sub={
            <>
              Cierre proyectado · <Delta value={((KPI.resultProj - KPI.resultPrev) / KPI.resultPrev) * 100} />
            </>
          }
          visual={<Sparkline data={[0.9, 1.1, 1.7, -0.6, -0.2, 0.6, 0.9, 1.2, 1.5, 1.3, 1.45, 1.9]} projectedFrom={10} color="var(--prov)" width={72} height={34} />}
          footer={<span className="text-prov">Falta el reporte de compras de septiembre</span>}
          onClick={() => setDrill('gastos')}
        />
        <KpiHero
          label="Punto de equilibrio"
          kind="provisional"
          value={`${Math.round(beRatio)} %`}
          sub={
            <>
              ≈ {arsCompact(KPI.salesProj)} de {arsCompact(KPI.breakEven)} necesarios
            </>
          }
          footer={
            <div className="flex flex-col gap-2">
              <ProgressBar value={KPI.salesReal} projected={KPI.salesProj - KPI.salesReal} max={KPI.salesProj * 1.02} />
              <div className="flex justify-between text-muted">
                <span>
                  Seguridad <span className="num font-medium text-ink">{pct(SAFETY_MARGIN)}</span>
                </span>
                <span className="num">≈ {unitsCompact(Math.round(KPI.breakEven / 590))} u.</span>
              </div>
            </div>
          }
          onClick={() => setDrill('ventas')}
        />
        <KpiHero
          label="Caja libre"
          kind="proyectado"
          value={arsCompact(KPI.cashFree)}
          sub="Disponible sin perforar la caja mínima en 60 días"
          footer={
            <div className="flex justify-between text-muted">
              <span>
                Caja hoy <span className="num font-medium text-ink">{arsCompact(KPI.cashTotal)}</span>
              </span>
              <span>
                Mínimo <span className="num font-medium text-ink">{arsCompact(KPI.cashFloor)}</span>
              </span>
            </div>
          }
          onClick={() => document.getElementById('caja')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
        <KpiHero
          label="Ventas del mes"
          kind="real"
          value={arsCompact(KPI.salesReal)}
          sub={
            <>
              {unitsCompact(KPI.unitsReal)} unidades al 26/09 · <Delta value={((CURRENT.units + (CURRENT.unitsProj ?? 0)) / PREV.units - 1) * 100} suffix="u. vs ago" />
            </>
          }
          visual={<Sparkline data={MONTHLY.map((m) => m.units + (m.unitsProj ?? 0))} projectedFrom={10} width={72} height={34} />}
          footer={
            <span className="text-muted">
              Cierre proyectado{' '}
              <DataValue kind="proyectado" className="font-medium text-ink">
                {arsCompact(KPI.salesProj)}
              </DataValue>
            </span>
          }
          onClick={() => setDrill('ventas')}
        />
      </motion.div>

      {/* Tira secundaria */}
      <motion.div variants={rise} className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0">
        <KpiMini label="Margen bruto" kind="provisional" value={pct(KPI.grossMarginPct)} sub={`${pct(KPI.grossMarginPct - KPI.grossMarginPrevPct, true)} vs ago`} />
        <KpiMini label="A cobrar" value={arsCompact(KPI.receivables)} sub={`${arsCompact(KPI.overdue)} vencido`} onClick={() => document.getElementById('cobrar')?.scrollIntoView({ behavior: 'smooth' })} />
        <KpiMini label="A pagar · 30 días" value={arsCompact(KPI.payables30d)} sub="3 niveles de certeza" />
        <KpiMini label="Cobrado en sep" value={arsCompact(KPI.collectedMonth)} sub="Dux al 26/09" />
        <KpiMini label="Clientes activos" value={int(KPI.activeCustomers)} sub={`+${KPI.newCustomersMonth} nuevos en sep`} onClick={() => nav('/g/clientes')} />
        <KpiMini label="Stock crítico" value={`${KPI.criticalStock} producto`} sub="Regular · 23 días" />
      </motion.div>

      {/* Ventas vs equilibrio + atención */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ventas vs punto de equilibrio"
            sub="Últimos 12 meses · netas de IVA · pesos nominales"
            action={
              <button onClick={() => setDrill('ventas')} className="hidden items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline sm:inline-flex">
                Detalle <ChevronRight size={14} />
              </button>
            }
          />
          <div className="pt-3 pb-4">
            <SalesChart
              height={340}
              onSelect={(m) => {
                if (m.key === CURRENT.key) setDrill('ventas')
                else toast({ title: 'Detalle de meses anteriores', body: 'En el prototipo el drill-down está armado para septiembre.', tone: 'info' })
              }}
            />
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Requiere tu atención" sub="Solo excepciones y decisiones" />
          <div className="flex flex-1 flex-col gap-2 p-3">
            {pendingDecisions.map((d) => (
              <button key={d.id} onClick={() => nav('/g/decisiones')} className="group flex items-start gap-3 rounded-xl p-2.5 text-left hover:bg-surface-2">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
                  <Scale size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] leading-snug font-medium">{d.title}</span>
                  <span className="text-[12px] text-muted">Decisión · de {d.raisedBy}</span>
                </span>
                <ChevronRight size={16} className="mt-1 text-muted" />
              </button>
            ))}
            {gerAlerts.map((a) => {
              const s = SEVERITY[a.severity]
              return (
                <div key={a.id} className="flex items-start gap-3 rounded-xl p-2.5">
                  <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', `bg-${s.tone}-soft text-${s.tone}-ink`)}>
                    <s.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] leading-snug font-medium">{a.title}</span>
                    <span className="text-[12px] text-muted">{a.detail}</span>
                  </span>
                </div>
              )
            })}
            <p className="mt-auto px-2.5 pt-1 text-[12px] text-muted">
              Administración resolvió 7 alertas operativas esta semana sin escalar.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Caja proyectada + cobrar / pagar */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="scroll-mt-20 lg:col-span-2" id="caja">
          <CardHeader
            title="Caja real y proyectada"
            sub="Tesorería Dux al 26/09 + cobros esperados + pagos programados"
            action={
              <Segmented
                size="sm"
                value={horizon}
                onChange={setHorizon}
                options={[
                  { value: '30', label: '30 d' },
                  { value: '60', label: '60 d' },
                  { value: '90', label: '90 d' },
                ]}
              />
            }
          />
          <div className="flex flex-wrap gap-x-6 gap-y-2 px-5 pt-3">
            <div>
              <div className="text-[12px] text-muted">Hoy</div>
              <div className="num text-[18px] font-semibold">{arsCompact(KPI.cashTotal)}</div>
            </div>
            <div>
              <div className="text-[12px] text-muted">Valle · 14/10</div>
              <div className="text-[18px] font-semibold">
                <DataValue kind="proyectado">{arsCompact(KPI.cashValley)}</DataValue>
              </div>
            </div>
            <div>
              <div className="text-[12px] text-muted">Caja mínima</div>
              <div className="num text-[18px] font-semibold">{arsCompact(KPI.cashFloor)}</div>
            </div>
            <div className="ml-auto flex items-end">
              <DataLegend kinds={['real', 'proyectado']} />
            </div>
          </div>
          <div className="pt-2 pb-4">
            <CashChart horizon={Number(horizon)} height={300} />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="scroll-mt-20" id="cobrar">
            <CardHeader title="A cobrar" sub="Todo lo pendiente, no solo lo vencido" action={<span className="num text-[15px] font-semibold">{arsCompact(receivablesTotal)}</span>} />
            <div className="flex flex-col gap-2 px-5 pt-3 pb-4">
              <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
                {AGING.map((a) => (
                  <div
                    key={a.key}
                    title={`${a.label}: ${ars(a.amount)}`}
                    style={{ width: `${(a.amount / receivablesTotal) * 100}%` }}
                    className={cn(
                      'h-full',
                      a.tone === 'neutral' && 'bg-line-strong',
                      a.tone === 'info' && 'bg-info',
                      a.tone === 'warn' && 'bg-warn',
                      a.tone === 'serious' && 'bg-serious',
                      a.tone === 'crit' && 'bg-crit',
                    )}
                  />
                ))}
              </div>
              {AGING.map((a) => (
                <div key={a.key} className="flex items-center justify-between text-[13px]">
                  <span className="inline-flex items-center gap-2 text-ink-2">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        a.tone === 'neutral' && 'bg-line-strong',
                        a.tone === 'info' && 'bg-info',
                        a.tone === 'warn' && 'bg-warn',
                        a.tone === 'serious' && 'bg-serious',
                        a.tone === 'crit' && 'bg-crit',
                      )}
                    />
                    {a.label}
                  </span>
                  <span className="num font-medium">{arsCompact(a.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="A pagar · 30 días" sub="Por nivel de certeza" action={<span className="num text-[15px] font-semibold">{arsCompact(payablesTotal)}</span>} />
            <div className="flex flex-col gap-2.5 px-5 pt-3 pb-4">
              {PAYABLES.map((p, i) => (
                <div key={p.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">{p.label}</span>
                    <span className="num font-medium">{arsCompact(p.amount)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={cn('h-full rounded-full', i === 0 ? 'bg-ink-2' : i === 1 ? 'bg-muted' : 'hatch-proj')}
                      style={{ width: `${(p.amount / payablesTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-muted">{p.detail}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div variants={rise} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-[15px] font-semibold">
            <Lightbulb size={17} className="text-accent" /> Lo que muestran los datos
          </h3>
          <button onClick={() => nav('/g/preguntar')} className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline">
            Preguntar <ArrowRight size={14} />
          </button>
        </div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:px-0">
          {INSIGHTS.map((i) => (
            <Card key={i.id} className="flex w-[280px] shrink-0 snap-start flex-col gap-2 p-4 md:w-auto">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid size-7 place-items-center rounded-lg',
                    i.tone === 'good' && 'bg-good-soft text-good-ink',
                    i.tone === 'warn' && 'bg-warn-soft text-warn-ink',
                    i.tone === 'info' && 'bg-info-soft text-info-ink',
                    i.tone === 'crit' && 'bg-crit-soft text-crit-ink',
                  )}
                >
                  {i.tone === 'good' ? <TrendingUp size={15} /> : i.tone === 'crit' || i.tone === 'warn' ? <TrendingDown size={15} /> : <Lightbulb size={15} />}
                </span>
                <span className="text-[14px] font-semibold">{i.title}</span>
              </div>
              <p className="text-[13px] text-ink-2">{i.body}</p>
              <p className="mt-auto border-t border-line pt-2 text-[11.5px] text-muted">
                <span className="font-medium">Evidencia:</span> {i.evidence}
              </p>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Comercial · Stock · Clientes */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Comercial" sub="Vendedor · últimos 7 días" action={<Badge tone="good">Conversión {SELLER_GOALS.conversion} %</Badge>} />
          <div className="flex flex-col gap-3.5 px-5 pt-4 pb-5">
            {[
              { label: 'Visitas', done: SELLER_GOALS.visits.done, target: SELLER_GOALS.visits.target, fmt: (n: number) => String(n) },
              { label: 'Clientes nuevos', done: SELLER_GOALS.newCustomers.done, target: SELLER_GOALS.newCustomers.target, fmt: (n: number) => String(n) },
              { label: 'Ventas', done: SELLER_GOALS.sales.done, target: SELLER_GOALS.sales.target, fmt: arsCompact },
            ].map((g) => (
              <div key={g.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-2">{g.label}</span>
                  <span className="num font-medium">
                    {g.fmt(g.done)} <span className="text-muted">/ {g.fmt(g.target)}</span>
                  </span>
                </div>
                <ProgressBar value={g.done} max={g.target} height={6} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Cobertura de stock" sub="Días según venta de 60 días · Dux al 21/09" action={<DataTag kind="provisional">Stock de hace 7 días</DataTag>} />
          <div className="flex flex-col gap-3 px-5 pt-4 pb-5">
            {PRODUCTS.filter((p) => p.unit === 'sauver' && p.dailyUnits)
              .map((p) => ({ p, days: Math.round(((p.stockLP ?? 0) + (p.stockST ?? 0)) / (p.dailyUnits ?? 1)) }))
              .sort((a, b) => a.days - b.days)
              .map(({ p, days }) => {
                const tone = days < 15 ? 'crit' : days < 30 ? 'serious' : days < 45 ? 'warn' : 'good'
                return (
                  <div key={p.id} className="flex items-center gap-3 text-[13px]">
                    <span className="w-28 shrink-0 truncate text-ink-2">{p.name.replace('Sauver ', '')}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div className={cn('h-full rounded-full', `bg-${tone}`)} style={{ width: `${Math.min(100, (days / 120) * 100)}%` }} />
                    </div>
                    <span className="num w-14 shrink-0 text-right font-medium">{days} d</span>
                  </div>
                )
              })}
            <p className="text-[12px] text-muted">Umbrales: +45 verde · 30–45 amarillo · 15–30 naranja · −15 rojo.</p>
          </div>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader title="Clientes" sub="Concentración y frecuencia" />
          <div className="flex flex-col gap-4 px-5 pt-4 pb-5">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-ink-2">Top 5 clientes</span>
                <span className="num text-[20px] font-semibold">47 %</span>
              </div>
              <div className="mt-2 flex h-2.5 gap-[2px] overflow-hidden rounded-full">
                {[30, 7, 4, 3.5, 2.5].map((w, i) => (
                  <div key={i} className="h-full bg-accent" style={{ width: `${w}%`, opacity: 1 - i * 0.14 }} />
                ))}
                <div className="h-full flex-1 bg-surface-3" />
              </div>
              <p className="mt-1.5 text-[12px] text-muted">Distribuidora Norte sola es el 30 % de las ventas.</p>
            </div>
            <div className="border-t border-line pt-3">
              <div className="mb-2 text-[13px] text-ink-2">Fuera de frecuencia</div>
              <div className="flex flex-col gap-1">
                {late.slice(0, 4).map((c) => (
                  <button key={c.id} onClick={() => nav(`/g/clientes/${c.id}`)} className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-2">
                    <span className="truncate">{c.name}</span>
                    <Badge tone={(repurchaseDelay(c) ?? 0) > 10 ? 'serious' : 'warn'}>+{repurchaseDelay(c)} días</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <DrillSheet root={DRILL_VENTAS} open={drill === 'ventas'} onClose={() => setDrill(null)} kind="real" />
      <DrillSheet root={DRILL_GASTOS} open={drill === 'gastos'} onClose={() => setDrill(null)} kind="provisional" />
    </motion.div>
  )
}
