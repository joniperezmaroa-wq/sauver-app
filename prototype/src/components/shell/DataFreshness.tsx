import { useNavigate } from 'react-router-dom'
import { Database } from 'lucide-react'
import type { Role } from '@/data/people'
import { DUX_COVERAGE } from '@/data/finance'
import { BASE } from './nav'

/** Chip de frescura: cada pantalla dice a qué fecha están los datos y si falta algo. */
export function DataFreshness({ role }: { role: Role }) {
  const nav = useNavigate()
  const missing = DUX_COVERAGE.flatMap((s) => s.rows).filter((r) => r.status !== 'ok').length
  if (role === 'vendedor') return null
  return (
    <button
      onClick={() => nav(`${BASE[role]}/datos`)}
      className="hidden h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[12.5px] text-ink-2 hover:border-line-strong sm:inline-flex"
      title="Estado de los reportes importados de Dux"
    >
      <Database size={14} className="text-muted" />
      <span>
        Dux al <span className="num font-medium text-ink">26/09</span>
      </span>
      {missing > 0 && (
        <span className="inline-flex items-center gap-1 text-warn-ink">
          <span className="size-1.5 rounded-full bg-warn" />
          {missing} a revisar
        </span>
      )}
    </button>
  )
}
