// Lenguaje de datos de SAUVER. Se usa igual en KPIs, gráficos, tablas e IA:
//   Real        → dato registrado (Dux o SAUVER). Trazo sólido.
//   Proyectado  → estimación a futuro. Trazo punteado / rayado, prefijo "≈".
//   Provisional → dato real pero incompleto o sin validar. Violeta, subrayado punteado.
//   Escenario   → resultado de una simulación. Azul, nunca se mezcla con lo real.

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
export type DataKind = 'real' | 'proyectado' | 'provisional' | 'escenario'

export const KIND_LABEL: Record<DataKind, string> = {
  real: 'Real',
  proyectado: 'Proyectado',
  provisional: 'Provisional',
  escenario: 'Escenario',
}

export const KIND_HELP: Record<DataKind, string> = {
  real: 'Dato registrado en Dux o en SAUVER App.',
  proyectado: 'Estimación a futuro según compromisos y velocidad actual.',
  provisional: 'Dato real pero incompleto o con costos sin validar. Puede cambiar.',
  escenario: 'Resultado de una simulación. No modifica datos reales.',
}

export function KindGlyph({ kind, size = 10 }: { kind: DataKind; size?: number }) {
  const r = size / 2
  if (kind === 'real')
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
        <circle cx={r} cy={r} r={r - 0.5} fill="var(--real)" />
      </svg>
    )
  if (kind === 'proyectado')
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
        <circle cx={r} cy={r} r={r - 1} fill="none" stroke="var(--proj)" strokeWidth="1.6" strokeDasharray="2 1.6" />
      </svg>
    )
  if (kind === 'provisional')
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
        <circle cx={r} cy={r} r={r - 0.8} fill="none" stroke="var(--prov)" strokeWidth="1.5" />
        <path d={`M ${r} 0.8 A ${r - 0.8} ${r - 0.8} 0 0 1 ${r} ${size - 0.8} Z`} fill="var(--prov)" />
      </svg>
    )
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
      <rect x={r - r * 0.62} y={r - r * 0.62} width={r * 1.24} height={r * 1.24} transform={`rotate(45 ${r} ${r})`} fill="var(--scen)" />
    </svg>
  )
}

const tagTone: Record<DataKind, string> = {
  real: 'text-ink-2 bg-surface-3',
  proyectado: 'text-accent-ink bg-accent-soft',
  provisional: 'text-prov bg-prov-soft',
  escenario: 'text-scen bg-scen-soft',
}

export function DataTag({ kind, className, children }: { kind: DataKind; className?: string; children?: ReactNode }) {
  return (
    <span
      title={KIND_HELP[kind]}
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11.5px] leading-none font-medium whitespace-nowrap',
        tagTone[kind],
        className,
      )}
    >
      <KindGlyph kind={kind} size={9} />
      {children ?? KIND_LABEL[kind]}
    </span>
  )
}

/** Valor numérico con el estilo de su tipo de dato. */
export function DataValue({ kind, children, className }: { kind: DataKind; children: ReactNode; className?: string }) {
  return (
    <span
      title={KIND_HELP[kind]}
      className={cn(
        'num',
        kind === 'proyectado' && 'val-proj',
        kind === 'provisional' && 'val-prov',
        kind === 'escenario' && 'text-scen',
        className,
      )}
    >
      {kind === 'proyectado' && <span className="mr-0.5 font-normal opacity-80">≈</span>}
      {children}
    </span>
  )
}

export function DataLegend({ kinds = ['real', 'proyectado', 'provisional'] as DataKind[], className }: { kinds?: DataKind[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted', className)}>
      {kinds.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5" title={KIND_HELP[k]}>
          <KindGlyph kind={k} size={9} />
          {KIND_LABEL[k]}
        </span>
      ))}
    </div>
  )
}
