// Piezas compartidas de gráficos: patrones SVG globales, tooltip y ejes con los tokens del tema.

import type { ReactNode } from 'react'
import { KindGlyph } from '@/components/ui/DataTag'
import type { DataKind } from '@/data/ask'

/** Patrones referenciables por url(#...) desde cualquier gráfico. Se monta una vez en App. */
export function ChartDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <pattern id="hatch-proj" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="color-mix(in oklab, var(--proj) 14%, var(--surface))" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--proj)" strokeWidth="2.2" strokeOpacity="0.55" />
        </pattern>
        <pattern id="hatch-prov" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
          <rect width="6" height="6" fill="color-mix(in oklab, var(--prov) 12%, var(--surface))" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--prov)" strokeWidth="2" strokeOpacity="0.5" />
        </pattern>
        <linearGradient id="grad-accent" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export const axisProps = {
  stroke: 'var(--line-strong)',
  tick: { fill: 'var(--muted)', fontSize: 11.5 },
  tickLine: false,
  axisLine: false,
} as const

export const gridProps = {
  stroke: 'var(--grid)',
  strokeDasharray: '0',
  vertical: false,
} as const

export interface TipRow {
  label: string
  value: string
  kind?: DataKind
  color?: string
}

export function ChartTip({ title, rows, foot }: { title: ReactNode; rows: TipRow[]; foot?: ReactNode }) {
  return (
    <div className="min-w-[180px] rounded-xl border border-line bg-surface px-3 py-2.5 text-[12.5px] shadow-[var(--shadow-float)]">
      <div className="mb-1.5 font-medium text-ink">{title}</div>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-ink-2">
              {r.kind ? <KindGlyph kind={r.kind} size={9} /> : r.color ? <span className="size-2 rounded-full" style={{ background: r.color }} /> : null}
              {r.label}
            </span>
            <span className="num font-medium text-ink">{r.value}</span>
          </div>
        ))}
      </div>
      {foot && <div className="mt-2 border-t border-line pt-1.5 text-[11.5px] text-muted">{foot}</div>}
    </div>
  )
}
