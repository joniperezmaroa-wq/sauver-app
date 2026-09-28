import { AlertTriangle, CheckCircle2, Clock, FileUp, XCircle } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/Progress'
import { DUX_COVERAGE, type CoverageRow } from '@/data/finance'
import { DUX_QUALITY } from '@/data/admin'
import { useApp } from '@/lib/store'

const STATUS: Record<CoverageRow['status'], { icon: typeof CheckCircle2; cls: string; label: string }> = {
  ok: { icon: CheckCircle2, cls: 'text-good-ink', label: 'Al día' },
  parcial: { icon: AlertTriangle, cls: 'text-prov', label: 'Parcial' },
  viejo: { icon: Clock, cls: 'text-warn-ink', label: 'Desactualizado' },
  falta: { icon: XCircle, cls: 'text-crit-ink', label: 'Falta' },
}

export function DatosDux({ canImport }: { canImport: boolean }) {
  const { toast } = useApp()
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight">Datos Dux</h2>
          <p className="mt-1 max-w-2xl text-[14px] text-muted">
            Qué reportes están importados, de qué fuente y hasta qué fecha. Si falta algo, los cálculos que dependen de ese reporte se muestran como provisionales.
          </p>
        </div>
        {canImport && (
          <Button variant="primary" onClick={() => toast({ title: 'El importador se construye en la Fase 2', body: 'Con los archivos reales de Dux.', tone: 'info' })}>
            <FileUp size={16} /> Importar reporte
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {DUX_COVERAGE.map((src) => {
          const missing = src.rows.filter((r) => r.status !== 'ok')
          return (
            <Card key={src.source} className={src.rows.length > 5 ? 'lg:col-span-2' : ''}>
              <CardHeader
                title={src.source}
                sub={`Unidades: ${src.units}`}
                action={missing.length ? <Badge tone="warn">{missing.length} a revisar</Badge> : <Badge tone="good">Completo</Badge>}
              />
              <div className={src.rows.length > 5 ? 'grid gap-x-6 px-5 pt-3 pb-4 sm:grid-cols-2' : 'px-5 pt-3 pb-4'}>
                {src.rows.map((r) => {
                  const s = STATUS[r.status]
                  return (
                    <div key={r.report} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                      <s.icon size={17} className={s.cls} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium">{r.report}</div>
                        <div className="text-[12px] text-muted">{r.note ?? s.label}</div>
                      </div>
                      <span className="num text-[13px] text-ink-2">{r.updated}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader title="Calidad de datos Dux" sub="Administración resuelve en Dux y vuelve a importar" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <ProgressRing value={DUX_QUALITY.score} size={84} stroke={8}>
            <span className="num text-[20px] font-semibold">{DUX_QUALITY.score}%</span>
          </ProgressRing>
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            {DUX_QUALITY.issues.map((i) => (
              <div key={i.label} className="flex items-center justify-between rounded-xl bg-surface-2 px-3.5 py-2.5 text-[13.5px]">
                <span className="text-ink-2">{i.label}</span>
                <span className="num font-semibold">{i.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <p className="text-[12.5px] text-muted">
        Prototipo: estados de ejemplo. El importador real (detección de reporte, validación, vista previa de cambios, reversión) se construye en la Fase 2 sobre archivos reales.
      </p>
    </div>
  )
}
