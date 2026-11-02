import { Store } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Foto de comercio. En el prototipo, si no hay foto real se dibuja una fachada ilustrada
 * con el tono del cliente (marcada como "Foto de ejemplo").
 */
export function Photo({
  src,
  tone = '#3d4f47',
  className,
  label,
  showExample = true,
}: {
  src?: string
  tone?: string
  className?: string
  label?: string
  showExample?: boolean
}) {
  if (src) {
    return <img src={src} alt={label ?? 'Foto'} className={cn('object-cover', className)} />
  }
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        background: `linear-gradient(160deg, color-mix(in oklab, ${tone} 70%, white) 0%, ${tone} 58%, color-mix(in oklab, ${tone} 70%, black) 100%)`,
      }}
      role="img"
      aria-label={label ?? 'Foto de ejemplo'}
    >
      {/* Fachada: toldo + vidriera */}
      <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full opacity-90">
        <rect x="18" y="38" width="124" height="62" fill="rgb(255 255 255 / 0.10)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M ${18 + i * 15.5} 30 h 15.5 v 10 q -7.75 6 -15.5 0 z`} fill={i % 2 ? 'rgb(255 255 255 / 0.55)' : 'rgb(255 255 255 / 0.2)'} />
        ))}
        <rect x="28" y="50" width="62" height="36" rx="2" fill="rgb(0 0 0 / 0.22)" />
        <rect x="100" y="50" width="30" height="50" rx="2" fill="rgb(0 0 0 / 0.28)" />
        <rect x="34" y="58" width="16" height="4" rx="1" fill="rgb(255 255 255 / 0.35)" />
        <rect x="54" y="58" width="22" height="4" rx="1" fill="rgb(255 255 255 / 0.25)" />
        <rect x="34" y="68" width="40" height="4" rx="1" fill="rgb(255 255 255 / 0.2)" />
      </svg>
      {showExample && (
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/35 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          <Store size={10} />
          Foto de ejemplo
        </span>
      )}
    </div>
  )
}
