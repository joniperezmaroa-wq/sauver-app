import { useLiveQuery } from 'dexie-react-hooks'
import { LogOut, RefreshCw } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth, useMe } from '@/lib/auth'
import { useSyncState, syncNow } from '@/lib/sync'
import { ThemeSwitch } from '@/components/shell/ThemeSwitch'
import { SyncChip } from '@/components/shell/SyncChip'
import { Button } from '@/components/ui/Button'
import { arsCompact, dayMonth } from '@/lib/format'
import { timeHM, weekStart } from '@/lib/dates'
import { useState } from 'react'

const KIND: Record<string, string> = { customer: 'Cliente', visit: 'Visita', order: 'Pedido' }

export function VendedorYo() {
  const me = useMe()
  const { signOut } = useAuth()
  const s = useSyncState()
  const [confirm, setConfirm] = useState(false)
  const outbox = useLiveQuery(() => db.outbox.toArray(), []) ?? []
  const target = useLiveQuery(() => db.targets.get(me.id), [me.id])
  const week = useLiveQuery(async () => {
    const ws = weekStart().toISOString()
    const orders = (await db.orders.where('seller_id').equals(me.id).toArray()).filter((o) => o.created_at >= ws && o.status !== 'cancelado')
    return { sales: orders.reduce((x, o) => x + Number(o.total), 0), orders: orders.length }
  }, [me.id])

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-ink text-[22px] font-semibold text-bg">{(me.full_name || '?').slice(0, 1)}</span>
        <div>
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{me.full_name}</h1>
          <p className="text-[13px] text-muted">{me.email}</p>
        </div>
      </div>

      <section className="rounded-[20px] border border-line bg-surface p-4">
        <h2 className="text-[15px] font-semibold">Objetivo semanal</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-surface-2 p-2.5">
            <div className="text-[11.5px] text-muted">Ventas</div>
            <div className="num text-[15px] font-semibold">{target?.weekly_sales ? arsCompact(Number(target.weekly_sales)) : '—'}</div>
          </div>
          <div className="rounded-xl bg-surface-2 p-2.5">
            <div className="text-[11.5px] text-muted">Visitas</div>
            <div className="num text-[15px] font-semibold">{target?.weekly_visits ?? 12}</div>
          </div>
          <div className="rounded-xl bg-surface-2 p-2.5">
            <div className="text-[11.5px] text-muted">Nuevos</div>
            <div className="num text-[15px] font-semibold">{target?.weekly_new_customers ?? 2}</div>
          </div>
        </div>
        {week && (
          <p className="mt-3 text-[13px] text-ink-2">
            Esta semana llevás <b className="num">{arsCompact(week.sales)}</b> en {week.orders} pedidos.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Envío de datos</h2>
          <SyncChip />
        </div>
        {outbox.length === 0 ? (
          <p className="text-[13px] text-muted">Todo lo que cargaste ya llegó.{s.lastSync ? ` Última actualización ${timeHM(new Date(s.lastSync))}.` : ''}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {outbox.map((e) => (
              <div key={e.seq} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px]">
                <span>
                  {KIND[e.kind]} · {dayMonth(new Date(e.created_at))} {timeHM(new Date(e.created_at))}
                </span>
                <span className={e.last_error ? 'text-[12px] text-crit-ink' : 'text-[12px] text-muted'}>{e.last_error ?? 'Esperando señal'}</span>
              </div>
            ))}
            <Button size="sm" onClick={() => void syncNow()} className="self-start">
              <RefreshCw size={14} /> Reintentar ahora
            </Button>
          </div>
        )}
      </section>

      <section className="flex items-center justify-between rounded-[20px] border border-line bg-surface p-4">
        <span className="text-[14px]">Tema</span>
        <ThemeSwitch />
      </section>

      {!confirm ? (
        <Button variant="ghost" size="lg" onClick={() => (outbox.length ? setConfirm(true) : void signOut())}>
          <LogOut size={16} /> Cerrar sesión
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl bg-crit-soft p-4 text-[13.5px]">
          <span className="text-crit-ink">Tenés {outbox.length} cosas sin enviar. Si cerrás sesión ahora se pierden. Esperá a tener señal.</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setConfirm(false)}>
              Volver
            </Button>
            <Button size="sm" variant="danger" onClick={() => void signOut()}>
              Cerrar igual
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
