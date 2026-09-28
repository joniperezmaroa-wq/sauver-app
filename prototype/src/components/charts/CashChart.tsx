import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CASH, KPI, cashValley } from '@/data/finance'
import { TODAY, addDays } from '@/lib/dates'
import { arsCompact, axisMoney, ddmm, dayMonth } from '@/lib/format'
import { axisProps, gridProps, ChartTip } from './ChartKit'

/**
 * Caja diaria: 30 días reales (línea sólida) + proyección (punteada) con banda de escenarios.
 * Marca la caja mínima y el valle del horizonte: no mira solo el fin de mes.
 */
export function CashChart({ horizon = 90, height = 260, history = 30, showBand = true }: { horizon?: number; height?: number; history?: number; showBand?: boolean }) {
  const from = addDays(TODAY, -history)
  const to = addDays(TODAY, horizon)
  const data = CASH.filter((p) => p.date >= from && p.date <= to).map((p) => ({
    ...p,
    t: p.date.getTime(),
    band: p.low != null && p.high != null ? [p.low, p.high] : undefined,
  }))
  const valley = cashValley(horizon)
  const below = data.some((p) => (p.proj ?? Infinity) < KPI.cashFloor)
  const values = data.flatMap((d) => [d.real, d.proj, d.low, d.high].filter((v): v is number => v != null))
  const yMin = Math.min(KPI.cashFloor, ...values)
  const yMax = Math.max(...values)
  const pad = (yMax - yMin) * 0.12

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 20, bottom: 0, left: 8 }}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            {...axisProps}
            dy={6}
            tickFormatter={(t) => ddmm(new Date(t))}
            ticks={Array.from({ length: Math.floor((horizon + history) / 15) + 1 }, (_, i) => addDays(from, i * 15).getTime())}
          />
          <YAxis
            {...axisProps}
            width={48}
            domain={[Math.max(0, Math.floor((yMin - pad) / 1e6) * 1e6), Math.ceil((yMax + pad) / 1e6) * 1e6]}
            tickFormatter={axisMoney}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as (typeof data)[number]
              const isReal = p.real != null && p.date <= TODAY
              const rows = isReal
                ? [{ label: 'Caja real', value: arsCompact(p.real!), kind: 'real' as const }]
                : [
                    { label: 'Esperado', value: arsCompact(p.proj!), kind: 'proyectado' as const },
                    ...(p.low != null ? [{ label: 'Conservador', value: arsCompact(p.low), color: 'var(--line-strong)' }] : []),
                  ]
              return (
                <ChartTip
                  title={dayMonth(p.date)}
                  rows={[...rows, { label: 'Caja mínima', value: arsCompact(KPI.cashFloor), color: 'var(--crit)' }]}
                  foot={p.event ? p.event : undefined}
                />
              )
            }}
          />
          {showBand && <Area dataKey="band" stroke="none" fill="var(--accent)" fillOpacity={0.09} isAnimationActive={false} />}
          <ReferenceLine
            y={KPI.cashFloor}
            stroke="var(--crit)"
            strokeWidth={1.5}
            strokeOpacity={0.8}
            label={{ value: 'Caja mínima', position: 'insideBottomRight', fill: 'var(--crit-ink)', fontSize: 11, dy: -4 }}
          />
          <ReferenceLine x={TODAY.getTime()} stroke="var(--line-strong)" label={{ value: 'Hoy', position: 'insideTopLeft', fill: 'var(--muted)', fontSize: 11, dx: 4 }} />
          <Line dataKey="real" type="linear" stroke="var(--ink)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive animationDuration={600} />
          <Line
            dataKey="proj"
            type="linear"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls={false}
            activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
          />
          {valley && (
            <ReferenceDot
              x={valley.date.getTime()}
              y={valley.proj}
              r={5}
              fill={below ? 'var(--crit)' : 'var(--warn)'}
              stroke="var(--surface)"
              strokeWidth={2}
              label={{ value: `Valle ${arsCompact(valley.proj!)} · ${ddmm(valley.date)}`, position: 'bottom', fill: 'var(--ink-2)', fontSize: 11.5, dy: 4 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
