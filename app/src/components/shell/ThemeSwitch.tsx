import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePref } from '@/lib/theme'
import { cn } from '@/lib/cn'

export function ThemeSwitch({ className }: { className?: string }) {
  const { pref, setPref } = useTheme()
  const opts: { v: ThemePref; icon: typeof Sun; label: string }[] = [
    { v: 'light', icon: Sun, label: 'Claro' },
    { v: 'system', icon: Monitor, label: 'Sistema' },
    { v: 'dark', icon: Moon, label: 'Oscuro' },
  ]
  return (
    <div className={cn('inline-flex rounded-[10px] bg-surface-3 p-0.5', className)} role="radiogroup" aria-label="Tema">
      {opts.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={pref === o.v}
          title={o.label}
          onClick={() => setPref(o.v)}
          className={cn(
            'grid h-7 w-8 place-items-center rounded-[8px] transition-colors',
            pref === o.v ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]' : 'text-muted hover:text-ink-2',
          )}
        >
          <o.icon size={14} />
        </button>
      ))}
    </div>
  )
}
