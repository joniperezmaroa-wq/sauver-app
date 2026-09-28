// Drill-down: RESUMEN → DETALLE → ORIGEN DEL DATO, sin perder el contexto de la pantalla.

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { Sheet } from './Sheet'
import type { DrillNode } from '@/data/finance'
import { ars } from '@/lib/format'
import { DataTag } from './DataTag'
import type { DataKind } from '@/data/ask'

export function DrillSheet({ root, open, onClose, kind = 'real' }: { root: DrillNode; open: boolean; onClose: () => void; kind?: DataKind }) {
  const [path, setPath] = useState<DrillNode[]>([root])
  useEffect(() => {
    if (open) setPath([root])
  }, [open, root])
  const node = path[path.length - 1]
  const max = Math.max(...(node.children?.map((c) => c.value) ?? [1]))

  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={560}
      eyebrow={
        <nav className="flex flex-wrap items-center gap-1" aria-label="Ruta del detalle">
          {path.map((p, i) => (
            <span key={p.id} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="text-line-strong" />}
              <button
                disabled={i === path.length - 1}
                onClick={() => setPath(path.slice(0, i + 1))}
                className="rounded px-0.5 hover:text-ink disabled:text-ink-2"
              >
                {i === 0 ? 'Resumen' : p.label}
              </button>
            </span>
          ))}
        </nav>
      }
      title={
        <span className="flex items-center gap-2">
          {path.length > 1 && (
            <button onClick={() => setPath(path.slice(0, -1))} className="-ml-1 grid size-7 place-items-center rounded-full hover:bg-surface-3" aria-label="Volver">
              <ChevronLeft size={18} />
            </button>
          )}
          {node.label}
        </span>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.16 }}
          className="flex flex-col gap-5 p-5"
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="num text-[30px] leading-none font-semibold tracking-tight">{ars(node.value)}</div>
              {node.sub && <div className="mt-1.5 text-[13px] text-muted">{node.sub}</div>}
            </div>
            <DataTag kind={kind} />
          </div>

          {node.children && (
            <div className="flex flex-col">
              {node.children.map((c) => {
                const canGo = !!(c.children || c.origin)
                return (
                  <button
                    key={c.id}
                    disabled={!canGo}
                    onClick={() => setPath([...path, c])}
                    className="group flex flex-col gap-2 border-b border-line py-3 text-left last:border-0 disabled:cursor-default"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium">{c.label}</div>
                        {c.sub && <div className="text-[12.5px] text-muted">{c.sub}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="num text-[14px] font-medium">{ars(c.value)}</span>
                        {canGo ? (
                          <ChevronRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
                        ) : (
                          <span className="w-4" />
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.value / max) * 100}%` }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </button>
                )
              })}
              {node.children.some((c) => !c.children && !c.origin) && (
                <p className="pt-3 text-[12px] text-muted">En el prototipo, el detalle completo está armado para las filas con flecha.</p>
              )}
            </div>
          )}

          {node.origin && (
            <div className="rounded-2xl border border-line bg-surface-2 p-4">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
                <FileSpreadsheet size={16} className="text-accent" />
                Origen del dato
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13px]">
                <dt className="text-muted">Comprobante</dt>
                <dd className="font-medium">{node.origin.doc}</dd>
                <dt className="text-muted">Fuente</dt>
                <dd>{node.origin.source}</dd>
                <dt className="text-muted">Importación</dt>
                <dd className="num">
                  {node.origin.batch} · {node.origin.importedAt} · {node.origin.by}
                </dd>
                <dt className="text-muted">Fila del archivo</dt>
                <dd className="num">{node.origin.row}</dd>
              </dl>
              <p className="mt-3 text-[12px] text-muted">
                Este dato vive en Dux. SAUVER lo muestra tal como se importó; si está mal, se corrige en Dux y se vuelve a importar.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  )
}
