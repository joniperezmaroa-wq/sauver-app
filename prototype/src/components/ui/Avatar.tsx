import { cn } from '@/lib/cn'

export function Avatar({ name, size = 32, tone, className }: { name: string; size?: number; tone?: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-ZÁÉÍÓÚÑ0-9]/i.test(w) && !['de', 'del', 'la', 'el', '&', 'y'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-semibold text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: tone ?? 'var(--accent)',
      }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
