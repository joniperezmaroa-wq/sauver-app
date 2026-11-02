import { useId } from 'react'

/** Sparkline SVG: línea de 2px, relleno suave y punto final destacado. */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = 'var(--accent)',
  projectedFrom,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  /** Índice desde el que la serie es proyectada (trazo punteado) */
  projectedFrom?: number
}) {
  const id = useId()
  const pad = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const x = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2)
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2)
  const pts = data.map((v, i) => [x(i), y(v)] as const)
  const cut = projectedFrom ?? data.length - 1
  const solid = pts.slice(0, cut + 1)
  const dashed = pts.slice(cut)
  const path = (p: readonly (readonly [number, number])[]) => p.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join(' ')
  const area = `${path(solid)} L${solid[solid.length - 1][0]},${height} L${solid[0][0]},${height} Z`
  const last = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path(solid)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {projectedFrom != null && dashed.length > 1 && (
        <path d={path(dashed)} fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
      )}
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
    </svg>
  )
}
