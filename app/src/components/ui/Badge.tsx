import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

export type Tone = 'neutral' | 'accent' | 'good' | 'warn' | 'serious' | 'crit' | 'info' | 'prov'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-ink-2',
  accent: 'bg-accent-soft text-accent-ink',
  good: 'bg-good-soft text-good-ink',
  warn: 'bg-warn-soft text-warn-ink',
  serious: 'bg-serious-soft text-serious-ink',
  crit: 'bg-crit-soft text-crit-ink',
  info: 'bg-info-soft text-info-ink',
  prov: 'bg-prov-soft text-prov',
}

export function Badge({ tone = 'neutral', children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] leading-none font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export type SeverityKey = 'critica' | 'atencion' | 'info' | 'ok'

export const SEVERITY: Record<SeverityKey, { label: string; tone: Tone; Icon: typeof Info; bar: string }> = {
  critica: { label: 'Crítica', tone: 'crit', Icon: OctagonAlert, bar: 'bg-crit' },
  atencion: { label: 'Atención', tone: 'warn', Icon: AlertTriangle, bar: 'bg-warn' },
  info: { label: 'Informativa', tone: 'info', Icon: Info, bar: 'bg-info' },
  ok: { label: 'Correcto', tone: 'good', Icon: CheckCircle2, bar: 'bg-good' },
}

export function SeverityBadge({ severity }: { severity: SeverityKey }) {
  const s = SEVERITY[severity]
  return (
    <Badge tone={s.tone} icon={<s.Icon size={13} strokeWidth={2.2} />}>
      {s.label}
    </Badge>
  )
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn('inline-block size-2 shrink-0 rounded-full', className)} />
}
