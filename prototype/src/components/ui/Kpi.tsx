import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { DataTag, DataValue } from './DataTag'
import type { DataKind } from '@/data/ask'

export function Delta({ value, suffix = 'vs ago', good = 'up' }: { value: number; suffix?: string; good?: 'up' | 'down' }) {
  const up = value >= 0
  const positive = good === 'up' ? up : !up
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px]">
      <span className={cn('inline-flex items-center font-medium', positive ? 'text-good-ink' : 'text-crit-ink')}>
        <Icon size={14} strokeWidth={2.4} />
        <span className="num">
          {Math.abs(value).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %
        </span>
      </span>
      <span className="text-muted">{suffix}</span>
    </span>
  )
}

/** KPI héroe: etiqueta, tipo de dato, número grande, contexto y acceso al detalle. */
export function KpiHero({
  label,
  kind,
  value,
  sub,
  footer,
  visual,
  onClick,
  className,
}: {
  label: string
  kind: DataKind
  value: ReactNode
  sub?: ReactNode
  footer?: ReactNode
  visual?: ReactNode
  onClick?: () => void
  className?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-[border-color,transform] duration-200 md:p-5',
        onClick && 'hover:-translate-y-0.5 hover:border-line-strong',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-2">{label}</span>
        <DataTag kind={kind} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[26px] leading-none font-semibold tracking-[-0.02em] whitespace-nowrap md:text-[30px]">
            <DataValue kind={kind}>{value}</DataValue>
          </div>
          {sub && <div className="mt-2 text-[12.5px] text-muted">{sub}</div>}
        </div>
        {visual && <div className="shrink-0">{visual}</div>}
      </div>
      {footer && <div className="border-t border-line pt-3 text-[12.5px]">{footer}</div>}
      {onClick && (
        <ChevronRight
          size={16}
          className="absolute top-1/2 right-2 -translate-y-1/2 text-muted opacity-0 transition-opacity group-hover:opacity-100 max-md:hidden"
        />
      )}
    </Tag>
  )
}

/** KPI compacto para tiras secundarias. */
export function KpiMini({
  label,
  value,
  kind = 'real',
  sub,
  onClick,
}: {
  label: string
  value: ReactNode
  kind?: DataKind
  sub?: ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'flex min-w-[148px] flex-1 flex-col gap-1 rounded-2xl border border-line bg-surface px-4 py-3 text-left',
        onClick && 'transition-colors hover:border-line-strong',
      )}
    >
      <span className="text-[12px] text-muted">{label}</span>
      <span className="text-[18px] leading-tight font-semibold tracking-tight">
        <DataValue kind={kind}>{value}</DataValue>
      </span>
      {sub && <span className="text-[12px] text-muted">{sub}</span>}
    </Tag>
  )
}
