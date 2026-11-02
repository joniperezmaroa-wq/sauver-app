import { CloudCheck, CloudOff, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useSyncState, syncNow } from '@/lib/sync'
import { cn } from '@/lib/cn'

/** Estado de sincronización siempre visible: el vendedor sabe si lo suyo ya llegó. */
export function SyncChip({ className }: { className?: string }) {
  const s = useSyncState()
  let icon = <CloudCheck size={14} />
  let text = 'Todo enviado'
  let tone = 'bg-good-soft text-good-ink'
  if (!s.online) {
    icon = <CloudOff size={14} />
    text = s.pending ? `Sin señal · ${s.pending} por enviar` : 'Sin señal · funciona igual'
    tone = 'bg-surface-3 text-ink-2'
  } else if (s.failed) {
    icon = <TriangleAlert size={14} />
    text = `${s.failed} con error · tocá para reintentar`
    tone = 'bg-crit-soft text-crit-ink'
  } else if (s.syncing || s.pending) {
    icon = <LoaderCircle size={14} className="animate-spin" />
    text = s.pending ? `Enviando ${s.pending}…` : 'Actualizando…'
    tone = 'bg-info-soft text-info-ink'
  }
  return (
    <button
      onClick={() => void syncNow()}
      className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium', tone, className)}
      title={s.lastError ?? undefined}
    >
      {icon}
      {text}
    </button>
  )
}
