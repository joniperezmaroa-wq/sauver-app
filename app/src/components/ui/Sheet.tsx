import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/cn'
import { usePortalTarget } from '@/lib/portal'

/** Panel lateral en desktop, hoja inferior en mobile. Mantiene el contexto de la pantalla. */
export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 520,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  eyebrow?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  const target = usePortalTarget()
  const wide = useMediaQuery('(min-width: 768px)')
  const desktop = wide && !target
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn(target ? 'absolute' : 'fixed', 'inset-0 z-50')} role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'absolute flex flex-col bg-surface shadow-[var(--shadow-float)]',
              desktop ? 'top-2 right-2 bottom-2 rounded-2xl border border-line' : 'inset-x-0 bottom-0 max-h-[92%] rounded-t-3xl pb-safe',
            )}
            style={desktop ? { width: `min(${width}px, calc(100vw - 16px))` } : undefined}
            initial={desktop ? { x: 40, opacity: 0 } : { y: '100%' }}
            animate={desktop ? { x: 0, opacity: 1 } : { y: 0 }}
            exit={desktop ? { x: 40, opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 380 }}
          >
            {!desktop && <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line-strong" />}
            {(title || eyebrow) && (
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 pt-4 pb-3">
                <div className="min-w-0">
                  {eyebrow && <div className="mb-1 text-[12px] text-muted">{eyebrow}</div>}
                  <h2 className="text-[17px] leading-snug font-semibold">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-3 hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    target ?? document.body,
  )
}
