import { useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { MONTHLY, type MonthPoint } from '@/data/finance'
import { arsCompact, axisMoney, int, monthShort, monthLong, capitalize, pct, unitsCompact } from '@/lib/format'
import { axisProps, gridProps, ChartTip } from './ChartKit'
import { Segmented } from '@/components/ui/Segmented'
import { KindGlyph } from '@/components/ui/DataTag'

type Metric = 'ventas' | 'unidades'

/**
 * Ventas de 12 meses contra el punto de equilibrio. El mes en curso muestra la parte real
 * (sólida) y la proyectada (rayada) apiladas. En unidades no hay punto de equilibrio.
 */
/** Barra con extremo de dato redondeado y base recta; si tiene parte proyectada encima, deja 2px de aire. */
function RoundedTop(props: unknown) {
  const { x, y, width, height, fill, opacity, payload } = props as {
    x: number; y: number; width: number; height: number; fill: string; opacity?: number; payload: { proj: number }
  }
  if (!height || height <= 0) return <g />
  const stacked = payload.proj > 0
  const h = stacked ? Math.max(0, height - 2) : height
  const top = stacked ? y + 2 : y
  const r = stacked ? 0 : Math.min(5, width / 2, h)
  const d = `M${x},${top + h} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + width - r},${top} Q${x + width},${top} ${x + width},${top + r} L${x + width},${top + h} Z`
  return <path d={d} fill={fill} opacity={opacity} />
}

export function SalesChart({ height = 260, onSelect, compact = false }: { height?: number; onSelect?: (m: MonthPoint) => void; compact?: boolean }) {
  const [metric, setMetric] = useState<Metric>('ventas')
  const [hover, setHover] = useState<number | null>(null)
  const data = MONTHLY.map((m) => ({
    ...m,
    label: monthShort(m.month),
    real: metric === 'ventas' ? m.sales : m.units,
    proj: metric === 'ventas' ? m.salesProj ?? 0 : m.unitsProj ?? 0,
    be: metric === 'ventas' ? m.breakEven : null,
  }))
  const fmt = metric === 'ventas' ? arsCompact : (n: number) => `${unitsCompact(n)} u.`

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5">
          <Segmented
            size="sm"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'ventas', label: 'Ventas $' },
              { value: 'unidades', label: 'Unidades' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <KindGlyph kind="real" size={9} /> Real
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="12" height="10" className="block" aria-hidden>
                <rect x="0.5" y="0.5" width="11" height="9" rx="2" fill="url(#hatch-proj)" stroke="var(--proj)" strokeDasharray="2 1.5" />
              </svg>
              Proyectado
            </span>
            {metric === 'ventas' && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 rounded bg-[var(--prov)]" /> Punto de equilibrio
                <span className="text-prov">(provisional)</span>
              </span>
            )}
          </div>
        </div>
      )}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: compact ? 8 : 20, bottom: 0, left: compact ? 0 : 8 }}
            onMouseMove={(s) => setHover(typeof s?.activeTooltipIndex === 'number' ? s.activeTooltipIndex : null)}
            onMouseLeave={() => setHover(null)}
            onClick={(s) => {
              const i = s?.activeTooltipIndex
              if (typeof i === 'number' && onSelect) onSelect(MONTHLY[i])
            }}
            barCategoryGap="28%"
          >
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} dy={6} />
            <YAxis {...axisProps} width={compact ? 40 : 48} domain={[0, 'auto']} tickFormatter={(v) => (metric === 'ventas' ? axisMoney(v) : unitsCompact(v))} />
            <Tooltip
              cursor={{ fill: 'var(--surface-3)', radius: 8 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as (typeof data)[number]
                const total = p.real + p.proj
                const rows = [
                  { label: p.proj ? 'Real al 26/09' : 'Real', value: fmt(p.real), kind: 'real' as const },
                  ...(p.proj ? [{ label: 'Cierre proyectado', value: fmt(total), kind: 'proyectado' as const }] : []),
                  ...(p.be ? [{ label: 'Punto de equilibrio', value: arsCompact(p.be), kind: 'provisional' as const }] : []),
                ]
                const foot = p.be
                  ? `${total >= p.be ? 'Sobre' : 'Bajo'} equilibrio: ${pct(((total - p.be) / p.be) * 100, true)}`
                  : `${int(total)} unidades`
                return <ChartTip title={`${capitalize(monthLong(p.month))} ${p.year}`} rows={rows} foot={onSelect ? `${foot} · clic para ver detalle` : foot} />
              }}
            />
            <Bar dataKey="real" stackId="s" maxBarSize={28} isAnimationActive animationDuration={700} shape={RoundedTop}>
              {data.map((d, i) => (
                <Cell
                  key={d.key}
                  fill={d.be && d.real + d.proj < d.be ? 'color-mix(in oklab, var(--accent) 45%, var(--surface))' : 'var(--accent)'}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              ))}
            </Bar>
            <Bar dataKey="proj" stackId="s" maxBarSize={28} fill="url(#hatch-proj)" stroke="var(--proj)" strokeWidth={1} strokeDasharray="3 2" radius={[5, 5, 0, 0]} />
            {metric === 'ventas' && (
              <Line
                dataKey="be"
                type="monotone"
                stroke="var(--prov)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--prov)', stroke: 'var(--surface)', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
