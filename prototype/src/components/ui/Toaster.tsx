import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, X } from 'lucide-react'
import { useApp } from '@/lib/store'

export function Toaster() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(10px+env(safe-area-inset-top,0px))] z-[60] flex flex-col items-center gap-2 px-4 md:top-auto md:bottom-6 md:items-end md:px-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-bg shadow-[var(--shadow-float)]"
          >
            {t.tone === 'info' ? (
              <Info size={18} className="mt-0.5 shrink-0 opacity-80" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--good)]" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium">{t.title}</div>
              {t.body && <div className="text-[12.5px] opacity-70">{t.body}</div>}
            </div>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick()
                  dismissToast(t.id)
                }}
                className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-semibold text-[var(--accent-ink)] hover:bg-white/10"
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismissToast(t.id)} aria-label="Cerrar" className="shrink-0 opacity-50 hover:opacity-90">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
