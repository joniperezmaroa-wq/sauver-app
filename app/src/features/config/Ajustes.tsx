import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useProfiles, useSettings } from '@/lib/data'
import { supabase, errorText } from '@/lib/supabase'
import { syncNow } from '@/lib/sync'
import { useToast } from '@/lib/toast'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { arsCompact } from '@/lib/format'

const inp = 'h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px] outline-none focus:border-accent'

export function Ajustes() {
  const s = useSettings()
  const toast = useToast()
  const profiles = useProfiles()
  const targets = useLiveQuery(() => db.targets.toArray(), []) ?? []
  const [maxDisc, setMaxDisc] = useState(String(s.max_discount))
  const [warehouse, setWarehouse] = useState(s.default_warehouse)
  const [vat, setVat] = useState(s.prices_include_vat)
  const [terms, setTerms] = useState(s.payment_terms.join(', '))
  useEffect(() => {
    setMaxDisc(String(s.max_discount))
    setWarehouse(s.default_warehouse)
    setVat(s.prices_include_vat)
    setTerms(s.payment_terms.join(', '))
  }, [s.updated_at]) // eslint-disable-line react-hooks/exhaustive-deps

  const sellers = [...profiles.values()].filter((p) => p.role === 'vendedor' && p.active)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h2 className="text-[22px] font-semibold tracking-tight">Ajustes</h2>
      <Card>
        <CardHeader title="Pedidos" sub="Reglas que aplica la app al tomar pedidos" />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
            Descuento máximo sin aprobación (%)
            <input id="s-disc" inputMode="decimal" className={inp} value={maxDisc} onChange={(e) => setMaxDisc(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
            Depósito habitual
            <input id="s-wh" className={inp} value={warehouse} onChange={(e) => setWarehouse(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2 sm:col-span-2">
            Condiciones de pago (separadas por coma)
            <input id="s-terms" className={inp} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-[14px]">
            <input id="s-vat" type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} className="size-5 accent-[var(--accent)]" />
            Los precios cargados incluyen IVA
          </label>
        </div>
        <div className="border-t border-line px-5 py-3">
          <Button
            variant="primary"
            onClick={async () => {
              const { error } = await supabase
                .from('app_settings')
                .update({
                  max_discount: Number(maxDisc.replace(',', '.')) || 0,
                  default_warehouse: warehouse.trim() || 'San Telmo',
                  prices_include_vat: vat,
                  payment_terms: terms.split(',').map((t) => t.trim()).filter(Boolean),
                })
                .eq('id', 1)
              if (error) return toast({ title: 'No se pudo guardar', body: errorText(error), tone: 'error' })
              toast({ title: 'Ajustes guardados' })
              void syncNow()
            }}
          >
            Guardar
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Objetivos semanales" sub="Lo que ve cada vendedor en su pantalla Hoy" />
        <div className="flex flex-col gap-4 p-5">
          {sellers.length === 0 && <p className="text-[13.5px] text-muted">Todavía no hay vendedores habilitados.</p>}
          {sellers.map((p) => (
            <TargetRow key={p.id} sellerId={p.id} name={p.full_name || p.email} current={targets.find((t) => t.seller_id === p.id)} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function TargetRow({ sellerId, name, current }: { sellerId: string; name: string; current?: { weekly_sales: number; weekly_visits: number; weekly_new_customers: number } }) {
  const toast = useToast()
  const [sales, setSales] = useState(String(current?.weekly_sales ?? ''))
  const [visits, setVisits] = useState(String(current?.weekly_visits ?? 12))
  const [news, setNews] = useState(String(current?.weekly_new_customers ?? 2))
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4">
      <div className="text-[14px] font-semibold">{name}</div>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-[12.5px] text-muted">
          Ventas $/semana
          <input id={`t-sales-${sellerId}`} inputMode="numeric" className={inp} value={sales} onChange={(e) => setSales(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="flex flex-col gap-1 text-[12.5px] text-muted">
          Visitas
          <input id={`t-vis-${sellerId}`} inputMode="numeric" className={inp} value={visits} onChange={(e) => setVisits(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="flex flex-col gap-1 text-[12.5px] text-muted">
          Clientes nuevos
          <input id={`t-new-${sellerId}`} inputMode="numeric" className={inp} value={news} onChange={(e) => setNews(e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-muted">{sales ? `${arsCompact(Number(sales))} por semana` : 'Sin objetivo de ventas'}</span>
        <Button
          size="sm"
          variant="primary"
          onClick={async () => {
            const { error } = await supabase.from('seller_targets').upsert({
              seller_id: sellerId,
              weekly_sales: Number(sales) || 0,
              weekly_visits: Number(visits) || 0,
              weekly_new_customers: Number(news) || 0,
            })
            if (error) return toast({ title: 'No se pudo guardar', body: errorText(error), tone: 'error' })
            toast({ title: 'Objetivo guardado' })
            void syncNow()
          }}
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}
