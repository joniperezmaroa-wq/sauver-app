import { useState } from 'react'
import { ClipboardPaste, Package, Plus } from 'lucide-react'
import { useProducts } from '@/lib/data'
import { supabase, errorText } from '@/lib/supabase'
import { syncNow } from '@/lib/sync'
import { useToast } from '@/lib/toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState } from '@/components/ui/EmptyState'
import { ars } from '@/lib/format'
import { UNIT_NAME, type Product, type UnitId } from '@/lib/types'

const UNITS: UnitId[] = ['sauver', 'joni', 'grower']
const blank = (): Partial<Product> => ({ business_unit: 'sauver', name: '', presentation: '', units_per_pack: 1, price: 0, active: true, code: '', sort: 100 })

export function Productos() {
  const products = useProducts(true)
  const toast = useToast()
  const [edit, setEdit] = useState<Partial<Product> | null>(null)
  const [paste, setPaste] = useState(false)

  const save = async (p: Partial<Product>) => {
    const row = {
      ...(p.id ? { id: p.id } : {}),
      business_unit: p.business_unit,
      code: p.code || null,
      name: (p.name ?? '').trim(),
      presentation: (p.presentation ?? '').trim(),
      units_per_pack: Number(p.units_per_pack) || 1,
      price: Number(p.price) || 0,
      active: p.active ?? true,
      sort: Number(p.sort) || 100,
    }
    const { error } = await supabase.from('products').upsert(row)
    if (error) return toast({ title: 'No se pudo guardar', body: errorText(error), tone: 'error' })
    toast({ title: 'Producto guardado' })
    setEdit(null)
    void syncNow()
  }

  if (!products) return null
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight">Productos y precios</h2>
          <p className="text-[13.5px] text-muted">Lo que ve el vendedor en el catálogo. Cada cambio de precio queda registrado.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPaste(true)}>
            <ClipboardPaste size={16} /> Pegar desde Excel
          </Button>
          <Button variant="primary" onClick={() => setEdit(blank())}>
            <Plus size={16} /> Nuevo
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Package size={24} />}
            title="Todavía no hay productos"
            body="Cargalos de a uno o pegá la lista desde Excel (exportada de Dux) con las columnas: unidad, código, nombre, presentación, unidades por bulto, precio."
            action={
              <Button variant="primary" onClick={() => setPaste(true)}>
                <ClipboardPaste size={16} /> Pegar desde Excel
              </Button>
            }
          />
        </Card>
      ) : (
        UNITS.filter((u) => products.some((p) => p.business_unit === u)).map((u) => (
          <Card key={u} className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-5 py-3 text-[14px] font-semibold">
              <span className="size-2.5 rounded-full" style={{ background: `var(--unit-${u})` }} />
              {UNIT_NAME[u]}
              <span className="font-normal text-muted">· {products.filter((p) => p.business_unit === u).length}</span>
            </div>
            {products
              .filter((p) => p.business_unit === u)
              .map((p) => (
                <button key={p.id} onClick={() => setEdit(p)} className="flex w-full items-center gap-3 border-b border-line px-5 py-3 text-left last:border-0 hover:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">
                      {p.name} {!p.active && <Badge className="ml-1 h-5">Inactivo</Badge>}
                    </div>
                    <div className="truncate text-[12.5px] text-muted">
                      {[p.code, p.presentation, p.units_per_pack > 1 ? `${p.units_per_pack} u. por bulto` : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span className="num text-[14.5px] font-semibold">{ars(Number(p.price))}</span>
                </button>
              ))}
          </Card>
        ))
      )}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar producto' : 'Nuevo producto'} width={480}>
        {edit && <ProductForm initial={edit} onSave={save} />}
      </Sheet>
      <Sheet open={paste} onClose={() => setPaste(false)} title="Pegar productos desde Excel" width={640}>
        {paste && <PasteImport existing={products} onDone={() => setPaste(false)} />}
      </Sheet>
    </div>
  )
}

const inp = 'h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px] outline-none focus:border-accent'

function ProductForm({ initial, onSave }: { initial: Partial<Product>; onSave: (p: Partial<Product>) => void }) {
  const [p, setP] = useState(initial)
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }))
  return (
    <div className="flex flex-col gap-4 p-5">
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
        Unidad de negocio
        <div className="flex gap-2">
          {UNITS.map((u) => (
            <button key={u} onClick={() => set('business_unit', u)} className={`h-10 flex-1 rounded-xl border text-[13.5px] ${p.business_unit === u ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line'}`}>
              {UNIT_NAME[u]}
            </button>
          ))}
        </div>
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
        Nombre
        <input id="pr-name" className={inp} value={p.name ?? ''} onChange={(e) => set('name', e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
          Presentación
          <input id="pr-pres" className={inp} placeholder="Caja x 50" value={p.presentation ?? ''} onChange={(e) => set('presentation', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
          Unidades por bulto
          <input id="pr-units" inputMode="numeric" className={inp} value={p.units_per_pack ?? 1} onChange={(e) => set('units_per_pack', Number(e.target.value.replace(/\D/g, '')) || 1)} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
          Precio por bulto
          <input id="pr-price" inputMode="decimal" className={inp} value={p.price ?? 0} onChange={(e) => set('price', Number(e.target.value.replace(/[^\d.]/g, '')) || 0)} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
          Código (Dux)
          <input id="pr-code" className={inp} value={p.code ?? ''} onChange={(e) => set('code', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
          Orden en el catálogo
          <input id="pr-sort" inputMode="numeric" className={inp} value={p.sort ?? 100} onChange={(e) => set('sort', Number(e.target.value) || 100)} />
        </label>
        <label className="flex items-center gap-2 pt-6 text-[14px]">
          <input id="pr-active" type="checkbox" checked={p.active ?? true} onChange={(e) => set('active', e.target.checked)} className="size-5 accent-[var(--accent)]" />
          Visible para el vendedor
        </label>
      </div>
      <Button variant="primary" size="lg" disabled={!p.name?.trim()} onClick={() => onSave(p)}>
        Guardar
      </Button>
    </div>
  )
}

/** Pega filas copiadas de Excel. Actualiza por código si ya existe; si no, crea. */
function PasteImport({ existing, onDone }: { existing: Product[]; onDone: () => void }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const unitOf = (s: string): UnitId | null => {
    const n = s.toLowerCase()
    if (n.includes('grower')) return 'grower'
    if (n.includes('joni')) return 'joni'
    if (n.includes('sauver') || n === '') return 'sauver'
    return null
  }
  const money = (s: string) => Number(s.replace(/\$|\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.split('\t'))
    .filter((c) => c.some((x) => x.trim()))
    .filter((c) => !/^(nombre|producto|descripci)/i.test((c[2] ?? '').trim())) // fila de títulos
    .map((c) => {
      const [u = '', code = '', name = '', pres = '', units = '1', price = '0'] = c.map((x) => x.trim())
      return { unit: unitOf(u), code, name, presentation: pres, units_per_pack: Number(units.replace(/\D/g, '')) || 1, price: money(price) }
    })
  const valid = rows.filter((r) => r.unit && r.name)
  const byCode = new Map(existing.filter((p) => p.code).map((p) => [p.code!, p]))

  return (
    <div className="flex flex-col gap-4 p-5">
      <p className="text-[13.5px] text-ink-2">
        Copiá desde Excel las columnas en este orden y pegalas abajo: <b>unidad</b> (Sauver, Joni o Grower) · <b>código</b> · <b>nombre</b> · <b>presentación</b> ·{' '}
        <b>unidades por bulto</b> · <b>precio</b>. Si el código ya existe, se actualiza.
      </p>
      <textarea id="paste-area" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Sauver\tREG50\tRegular\tCaja x 50\t50\t24000'} className="w-full rounded-xl border border-line-strong bg-surface p-3 font-mono text-[12.5px] outline-none focus:border-accent" />
      {rows.length > 0 && (
        <div className="max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full text-[12.5px]">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-3 py-1.5">{r.unit ? UNIT_NAME[r.unit] : <span className="text-crit-ink">¿Unidad?</span>}</td>
                  <td className="px-2 py-1.5 text-muted">{r.code}</td>
                  <td className="px-2 py-1.5">{r.name || <span className="text-crit-ink">Falta nombre</span>}</td>
                  <td className="px-2 py-1.5 text-muted">{r.presentation}</td>
                  <td className="num px-2 py-1.5 text-right">{ars(r.price)}</td>
                  <td className="px-3 py-1.5 text-right text-[11.5px] text-muted">{r.code && byCode.has(r.code) ? 'actualiza' : 'nuevo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Button
        variant="primary"
        size="lg"
        disabled={!valid.length || busy}
        onClick={async () => {
          setBusy(true)
          const payload = valid.map((r, i) => ({
            ...(r.code && byCode.has(r.code) ? { id: byCode.get(r.code)!.id } : {}),
            business_unit: r.unit!,
            code: r.code || null,
            name: r.name,
            presentation: r.presentation,
            units_per_pack: r.units_per_pack,
            price: r.price,
            active: true,
            sort: (i + 1) * 10,
          }))
          const updates = payload.filter((p) => 'id' in p)
          const inserts = payload.filter((p) => !('id' in p))
          const results = await Promise.all([
            updates.length ? supabase.from('products').upsert(updates) : Promise.resolve({ error: null }),
            inserts.length ? supabase.from('products').insert(inserts) : Promise.resolve({ error: null }),
          ])
          setBusy(false)
          const err = results.find((r) => r.error)?.error
          if (err) return toast({ title: 'No se pudo importar', body: errorText(err), tone: 'error' })
          toast({ title: `${valid.length} productos cargados` })
          void syncNow()
          onDone()
        }}
      >
        Cargar {valid.length || ''} productos
      </Button>
    </div>
  )
}
