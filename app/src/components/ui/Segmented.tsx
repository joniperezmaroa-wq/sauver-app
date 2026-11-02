import { motion } from 'motion/react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  options: { value: T; label: React.ReactNode; count?: number }[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  const id = useId()
  return (
    <div
      role="tablist"
      className={cn('inline-flex max-w-full overflow-x-auto rounded-[11px] bg-surface-3 p-[3px] scrollbar-none', className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative shrink-0 rounded-[8px] font-medium whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-[12.5px]' : 'h-8 px-3 text-[13px]',
              active ? 'text-ink' : 'text-muted hover:text-ink-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[8px] bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.label}
              {o.count != null && (
                <span className={cn('num text-[11px]', active ? 'text-ink-2' : 'text-muted')}>{o.count}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
