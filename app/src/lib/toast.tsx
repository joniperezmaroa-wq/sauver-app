import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

export interface Toast {
  id: number
  title: string
  body?: string
  tone?: 'good' | 'info' | 'error'
  action?: { label: string; onClick: () => void }
}

const Ctx = createContext<((t: Omit<Toast, 'id'>) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)
  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])
  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq.current
      setToasts((ts) => [...ts.slice(-2), { ...t, id }])
      window.setTimeout(() => dismiss(id), t.tone === 'error' ? 7000 : 4200)
    },
    [dismiss],
  )
  const value = useMemo(() => toast, [toast])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[calc(10px+env(safe-area-inset-top,0px))] z-[80] flex flex-col items-center gap-2 px-4 md:top-auto md:bottom-6 md:items-end md:px-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-bg shadow-[var(--shadow-float)]"
            >
              {t.tone === 'info' ? (
                <Info size={18} className="mt-0.5 shrink-0 opacity-80" />
              ) : t.tone === 'error' ? (
                <CircleAlert size={18} className="mt-0.5 shrink-0 text-[var(--crit)]" />
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
                    dismiss(t.id)
                  }}
                  className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-semibold text-[var(--accent-ink)]"
                >
                  {t.action.label}
                </button>
              )}
              <button onClick={() => dismiss(t.id)} aria-label="Cerrar" className="shrink-0 opacity-50 hover:opacity-90">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast fuera de ToastProvider')
  return c
}
