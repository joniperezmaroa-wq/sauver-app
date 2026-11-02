import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

export function ProgressBar({
  value,
  max = 100,
  projected,
  tone = 'accent',
  className,
  height = 8,
}: {
  value: number
  max?: number
  /** Parte proyectada adicional (se dibuja rayada) */
  projected?: number
  tone?: 'accent' | 'good' | 'warn' | 'crit' | 'prov'
  className?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const projPct = projected ? Math.max(0, Math.min(100 - pct, (projected / max) * 100)) : 0
  const fill = {
    accent: 'bg-accent',
    good: 'bg-good',
    warn: 'bg-warn',
    crit: 'bg-crit',
    prov: 'bg-prov',
  }[tone]
  return (
    <div className={cn('relative flex w-full overflow-hidden rounded-full bg-surface-3', className)} style={{ height }}>
      <motion.div
        className={cn('h-full rounded-l-full', fill, projPct === 0 && 'rounded-r-full')}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      {projPct > 0 && (
        <motion.div
          className="hatch-proj h-full rounded-r-full border-l-2 border-surface"
          initial={{ width: 0 }}
          animate={{ width: `${projPct}%` }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </div>
  )
}

export function ProgressRing({
  value,
  max = 100,
  size = 56,
  stroke = 6,
  tone = 'accent',
  children,
}: {
  value: number
  max?: number
  size?: number
  stroke?: number
  tone?: 'accent' | 'good' | 'warn'
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))
  const color = { accent: 'var(--accent)', good: 'var(--good)', warn: 'var(--warn)' }[tone]
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
