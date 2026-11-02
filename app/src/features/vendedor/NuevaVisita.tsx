// Flujo de calle: cliente → foto → resultado → (pedido) → listo.
// Todo se guarda en el celular y se envía solo; funciona sin señal.

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  Frown,
  Handshake,
  ImagePlus,
  MessageSquareOff,
  Minus,
  PartyPopper,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'
import { db, uuid } from '@/lib/db'
import { useMe } from '@/lib/auth'
import { useCustomers, useProducts, useSettings } from '@/lib/data'
import { newCustomer, saveCustomer, saveOrder, saveVisit } from '@/lib/actions'
import { compressPhoto, type CompressedPhoto } from '@/lib/image'
import { useToast } from '@/lib/toast'
import { ars, arsCompact, dayMonth } from '@/lib/format'
import { addDays, isoDay, today } from '@/lib/dates'
import { CHANNELS, UNIT_NAME, type Customer, type Outcome, type Product, type UnitId } from '@/lib/types'
import { cn } from '@/lib/cn'

type Step = 'cliente' | 'prospecto' | 'foto' | 'resultado' | 'detalle' | 'pedido' | 'resumen' | 'listo'

const OUTCOMES: { v: Outcome; label: string; sub: string; icon: typeof ShoppingBag; cls: string }[] = [
  { v: 'compro', label: 'Compró', sub: 'Armar el pedido', icon: ShoppingBag, cls: 'bg-accent text-on-accent' },
  { v: 'interesado', label: 'Interesado', sub: 'Qué le interesó', icon: Handshake, cls: 'bg-info-soft text-info-ink' },
  { v: 'volver', label: 'Volver', sub: 'Agendar revisita', icon: RotateCcw, cls: 'bg-warn-soft text-warn-ink' },
  { v: 'no_interesado', label: 'No interesado', sub: 'Por qué', icon: Frown, cls: 'bg-surface-3 text-ink-2' },
  { v: 'no_hablo', label: 'No pude hablar', sub: 'Sin datos', icon: MessageSquareOff, cls: 'bg-surface-3 text-ink-2' },
]

const OBJECTIONS = ['Precio', 'Otra marca', 'Tiene stock', 'Hablar con dueño', 'Quiere probar', 'Otro']
const NOT_INTERESTED = ['Precio', 'No vende el rubro', 'Exclusividad con otra marca', 'Mal momento', 'Otro']
const NEXT_VISIT = [
  { label: 'En 3 días', days: 3 },
  { label: 'Próx. semana', days: 7 },
  { label: 'En 15 días', days: 15 },
]

export function NuevaVisita() {
  const me = useMe()
  const nav = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const pre = params.get('c')
  const preCustomer = useLiveQuery(async () => (pre ? (await db.customers.get(pre)) ?? null : null), [pre])

  const [step, setStep] = useState<Step>(pre ? 'foto' : 'cliente')
  const [history, setHistory] = useState<Step[]>([])
  const [picked, setPicked] = useState<Customer | null>(null)
  const client = picked ?? preCustomer ?? null
  const [isNew, setIsNew] = useState(false)
  const [photo, setPhoto] = useState<CompressedPhoto | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [interest, setInterest] = useState<string[]>([])
  const [objections, setObjections] = useState<string[]>([])
  const [reason, setReason] = useState<string | null>(null)
  const [nextVisit, setNextVisit] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [orderNumberHint, setOrderSent] = useState<boolean>(false)
  const [visitId] = useState(() => uuid())
  const [busy, setBusy] = useState(false)

  const go = (s: Step) => {
    setHistory((h) => [...h, step])
    setStep(s)
    document.getElementById('vendor-scroll')?.scrollTo({ top: 0 })
  }
  const back = () => {
    const prev = history[history.length - 1]
    if (!prev) return nav(-1)
    setHistory((h) => h.slice(0, -1))
    setStep(prev)
  }

  const finishVisitOnly = async () => {
    if (!client || !outcome || busy) return
    setBusy(true)
    try {
      await saveVisit({
        id: visitId,
        customerId: client.id,
        sellerId: me.id,
        outcome,
        interest,
        objections,
        reason,
        nextVisit: nextVisit ? isoDay(addDays(today(), nextVisit)) : null,
        comment,
        photo,
      })
      go('listo')
    } catch (e) {
      toast({ title: 'No se pudo guardar la visita', body: String(e), tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const stepIndex = { cliente: 0, prospecto: 0, foto: 1, resultado: 2, detalle: 3, pedido: 3, resumen: 4, listo: 5 }[step]

  if (pre && preCustomer === undefined) return null

  return (
    <div className="flex min-h-full flex-col">
      {step !== 'listo' && (
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-[color-mix(in_oklab,var(--bg)_90%,transparent)] px-3 py-2.5 backdrop-blur-md">
          <button onClick={back} className="grid size-10 place-items-center rounded-full hover:bg-surface-3" aria-label="Atrás">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{client ? client.name : 'Nueva visita'}</div>
            <div className="flex gap-1 pt-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= stepIndex ? 'bg-accent' : 'bg-surface-3')} />
              ))}
            </div>
          </div>
          <button onClick={() => nav('/v')} className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-3" aria-label="Salir">
            <X size={20} />
          </button>
        </header>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.16 }}
          className="flex flex-1 flex-col"
        >
          {step === 'cliente' && (
            <StepCliente
              ownerId={me.id}
              onPick={(c) => {
                setPicked(c)
                go('foto')
              }}
              onNew={() => go('prospecto')}
            />
          )}
          {step === 'prospecto' && (
            <StepProspecto
              ownerId={me.id}
              onCreate={async (c) => {
                await saveCustomer(c)
                setPicked(c)
                setIsNew(true)
                go('foto')
              }}
            />
          )}
          {step === 'foto' && client && <StepFoto photo={photo} setPhoto={setPhoto} onNext={() => go('resultado')} />}
          {step === 'resultado' && (
            <div className="flex flex-col gap-3 px-4 pt-5 pb-8">
              <h2 className="text-[22px] font-semibold tracking-tight">¿Cómo fue la visita?</h2>
              {OUTCOMES.map((o, i) => (
                <motion.button
                  key={o.v}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setOutcome(o.v)
                    go(o.v === 'compro' ? 'pedido' : 'detalle')
                  }}
                  className={cn('flex items-center gap-4 rounded-[20px] px-5 text-left', o.cls, i === 0 ? 'h-[84px]' : 'h-[68px]')}
                >
                  <o.icon size={i === 0 ? 28 : 24} />
                  <span className="flex-1">
                    <span className={cn('block font-semibold', i === 0 ? 'text-[19px]' : 'text-[17px]')}>{o.label}</span>
                    <span className="block text-[13px] opacity-75">{o.sub}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          )}
          {step === 'detalle' && outcome && (
            <StepDetalle
              outcome={outcome}
              interest={interest}
              setInterest={setInterest}
              objections={objections}
              setObjections={setObjections}
              reason={reason}
              setReason={setReason}
              nextVisit={nextVisit}
              setNextVisit={setNextVisit}
              comment={comment}
              setComment={setComment}
              busy={busy}
              onSave={finishVisitOnly}
            />
          )}
          {step === 'pedido' && client && <StepPedido client={client} cart={cart} setCart={setCart} onNext={() => go('resumen')} />}
          {step === 'resumen' && client && (
            <StepResumen
              client={client}
              cart={cart}
              busy={busy}
              onSend={async (o) => {
                if (busy) return
                setBusy(true)
                try {
                  await saveVisit({ id: visitId, customerId: client.id, sellerId: me.id, outcome: 'compro', comment, photo })
                  await saveOrder({ ...o, customer: client, sellerId: me.id, visitId })
                  setOrderSent(true)
                  go('listo')
                } catch (e) {
                  toast({ title: 'No se pudo guardar el pedido', body: String(e), tone: 'error' })
                } finally {
                  setBusy(false)
                }
              }}
            />
          )}
          {step === 'listo' && (
            <StepListo
              isNew={isNew}
              withOrder={orderNumberHint}
              photo={!!photo}
              nextVisit={nextVisit}
              onHome={() => nav('/v')}
              onAgain={() => nav('/v/visita', { replace: true, state: { t: Date.now() } })}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ————— Cliente —————

function StepCliente({ ownerId, onPick, onNew }: { ownerId: string; onPick: (c: Customer) => void; onNew: () => void }) {
  const [q, setQ] = useState('')
  const mine = useCustomers(ownerId) ?? []
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const list = q ? mine.filter((c) => norm(`${c.name} ${c.zone ?? ''} ${c.address ?? ''}`).includes(norm(q))) : mine.slice(0, 30)
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      <h2 className="text-[22px] font-semibold tracking-tight">¿Dónde estás?</h2>
      <label className="flex h-12 items-center gap-2 rounded-2xl border border-line-strong bg-surface px-4 focus-within:border-accent">
        <Search size={18} className="text-muted" />
        <input id="visit-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente, zona o dirección" className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted" />
      </label>
      <button onClick={onNew} className="flex h-14 items-center gap-3 rounded-2xl border-2 border-dashed border-line-strong px-4 text-left active:bg-surface-3">
        <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-ink">
          <UserPlus size={18} />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold">Cliente nuevo</span>
          <span className="block text-[12.5px] text-muted">Nombre y canal; el resto, si lo tenés</span>
        </span>
      </button>
      {list.length > 0 && <div className="text-[12px] font-medium tracking-wide text-muted uppercase">{q ? 'Resultados' : 'Mis clientes'}</div>}
      <div className="flex flex-col gap-2">
        {list.map((c) => (
          <button key={c.id} onClick={() => onPick(c)} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left active:scale-[0.99]">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-3 text-[15px] font-semibold text-ink-2">{c.name.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{c.name}</span>
              <span className="block truncate text-[12.5px] text-muted">
                {c.channel}
                {c.zone ? ` · ${c.zone}` : ''}
                {c.status === 'prospecto' ? ' · prospecto' : ''}
              </span>
            </span>
          </button>
        ))}
        {q && list.length === 0 && <p className="py-6 text-center text-[13.5px] text-muted">No encontramos “{q}”. Crealo como cliente nuevo.</p>}
      </div>
    </div>
  )
}

// ————— Cliente nuevo —————

function StepProspecto({ ownerId, onCreate }: { ownerId: string; onCreate: (c: Customer) => Promise<void> }) {
  const mine = useCustomers(ownerId) ?? []
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<string | null>(null)
  const [zone, setZone] = useState('')
  const [address, setAddress] = useState('')
  const [wa, setWa] = useState('')
  const [contact, setContact] = useState('')
  const [busy, setBusy] = useState(false)
  const zones = useMemo(() => [...new Set(mine.map((c) => c.zone).filter(Boolean) as string[])].slice(0, 8), [mine])
  const dup = name.trim().length > 3 ? mine.find((c) => c.name.toLowerCase().includes(name.trim().toLowerCase().slice(0, 8))) : undefined
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pt-5 pb-6">
      <h2 className="text-[22px] font-semibold tracking-tight">Cliente nuevo</h2>
      <Field label="Nombre del comercio">
        <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Kiosco Don Pepe" className={inputCls} />
      </Field>
      {dup && (
        <div className="-mt-3 rounded-xl bg-warn-soft px-3 py-2 text-[13px] text-ink-2">
          Ya tenés <span className="font-semibold">{dup.name}</span>
          {dup.zone ? ` (${dup.zone})` : ''}. ¿Es el mismo? Evitemos duplicados.
        </div>
      )}
      <Field label="Canal">
        <Chips options={CHANNELS} value={channel ? [channel] : []} onToggle={setChannel} />
      </Field>
      <Field label="Zona o barrio">
        <input id="p-zone" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ej: San Telmo" className={inputCls} />
        {zones.length > 0 && !zone && <Chips options={zones} value={[]} onToggle={setZone} small />}
      </Field>
      <Field label="Dirección (opcional)">
        <input id="p-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle y número" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="WhatsApp (opcional)">
          <input id="p-wa" inputMode="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="11 5555 0000" className={inputCls} />
        </Field>
        <Field label="Contacto (opcional)">
          <input id="p-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Quién atiende" className={inputCls} />
        </Field>
      </div>
      <div className="mt-auto pt-2">
        <BigButton
          disabled={!name.trim() || !channel || busy}
          onClick={async () => {
            setBusy(true)
            await onCreate(
              newCustomer(ownerId, {
                name: name.trim(),
                channel: channel!,
                zone: zone.trim() || null,
                address: address.trim() || null,
                whatsapp: wa.trim() || null,
                contact_name: contact.trim() || null,
              }),
            )
            setBusy(false)
          }}
        >
          Continuar
        </BigButton>
      </div>
    </div>
  )
}

// ————— Foto —————

function StepFoto({ photo, setPhoto, onNext }: { photo: CompressedPhoto | null; setPhoto: (p: CompressedPhoto | null) => void; onNext: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight">Foto del comercio</h2>
        <p className="text-[14px] text-muted">Queda en el historial del cliente. Es opcional.</p>
      </div>
      <input
        ref={input}
        id="visit-photo"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setBusy(true)
          try {
            setPhoto(await compressPhoto(f))
          } finally {
            setBusy(false)
            e.target.value = ''
          }
        }}
      />
      <button onClick={() => input.current?.click()} className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] border-2 border-dashed border-line-strong bg-surface-2">
        {photo ? (
          <img src={photo.url} alt="Foto de la visita" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-3 text-ink-2">
            <span className="grid size-16 place-items-center rounded-3xl bg-accent text-on-accent">{busy ? <Clock3 size={28} /> : <Camera size={30} />}</span>
            <span className="text-[16px] font-semibold">{busy ? 'Optimizando…' : 'Sacar foto'}</span>
            <span className="text-[12.5px] text-muted">o elegir de la galería</span>
          </span>
        )}
      </button>
      {photo && (
        <div className="flex items-center justify-between rounded-xl bg-good-soft px-3 py-2 text-[12.5px] text-good-ink">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Optimizada: {photo.originalKb.toLocaleString('es-AR')} KB → {photo.compressedKb.toLocaleString('es-AR')} KB
          </span>
          <button onClick={() => input.current?.click()} className="inline-flex items-center gap-1 font-medium">
            <ImagePlus size={14} /> Otra
          </button>
        </div>
      )}
      <div className="mt-auto pt-4">
        <BigButton onClick={onNext}>{photo ? 'Continuar' : 'Seguir sin foto'}</BigButton>
      </div>
    </div>
  )
}

// ————— Detalle según resultado —————

function StepDetalle(p: {
  outcome: Outcome
  interest: string[]
  setInterest: (v: string[]) => void
  objections: string[]
  setObjections: (v: string[]) => void
  reason: string | null
  setReason: (v: string | null) => void
  nextVisit: number | null
  setNextVisit: (v: number | null) => void
  comment: string
  setComment: (v: string) => void
  busy: boolean
  onSave: () => void
}) {
  const products = useProducts() ?? []
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const title = { interesado: 'Interesado', volver: 'Volver', no_interesado: 'No interesado', no_hablo: 'No pudiste hablar', compro: '' }[p.outcome]
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pt-5 pb-6">
      <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
      {p.outcome === 'interesado' && (
        <>
          {products.length > 0 && (
            <Field label="¿Qué le interesó?">
              <Chips options={[...new Set(products.filter((x) => x.business_unit === 'sauver').map((x) => x.name))].slice(0, 10)} value={p.interest} onToggle={(v) => p.setInterest(toggle(p.interest, v))} />
            </Field>
          )}
          <Field label="Objeciones">
            <Chips options={OBJECTIONS} value={p.objections} onToggle={(v) => p.setObjections(toggle(p.objections, v))} />
          </Field>
        </>
      )}
      {p.outcome === 'no_interesado' && (
        <Field label="Motivo">
          <Chips options={NOT_INTERESTED} value={p.reason ? [p.reason] : []} onToggle={p.setReason} />
        </Field>
      )}
      {p.outcome !== 'no_interesado' && (
        <Field label={p.outcome === 'no_hablo' ? '¿Volver?' : 'Próxima visita'}>
          <div className="grid grid-cols-3 gap-2">
            {NEXT_VISIT.map((o) => (
              <button
                key={o.days}
                onClick={() => p.setNextVisit(p.nextVisit === o.days ? null : o.days)}
                className={cn(
                  'flex h-16 flex-col items-center justify-center rounded-2xl border text-[14px] font-medium transition-colors',
                  p.nextVisit === o.days ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface',
                )}
              >
                {o.label}
                <span className="text-[11.5px] font-normal text-muted">{dayMonth(addDays(today(), o.days))}</span>
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Comentario (opcional)">
        <textarea id="visit-comment" value={p.comment} onChange={(e) => p.setComment(e.target.value)} rows={3} placeholder="Algo que convenga recordar" className="w-full resize-none rounded-2xl border border-line-strong bg-surface px-4 py-3 text-[16px] outline-none focus:border-accent" />
      </Field>
      <div className="mt-auto pt-2">
        <BigButton onClick={p.onSave} disabled={p.busy}>
          Guardar visita
        </BigButton>
      </div>
    </div>
  )
}

// ————— Pedido —————

function StepPedido({ client, cart, setCart, onNext }: { client: Customer; cart: Record<string, number>; setCart: (c: Record<string, number>) => void; onNext: () => void }) {
  const products = useProducts() ?? []
  const toast = useToast()
  const settings = useSettings()
  const [unit, setUnit] = useState<'todos' | UnitId>('todos')
  const [q, setQ] = useState('')
  const last = useLiveQuery(async () => {
    const orders = (await db.orders.where('customer_id').equals(client.id).toArray()).filter((o) => o.status !== 'cancelado')
    orders.sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (!orders[0]) return null
    return db.order_items.where('order_id').equals(orders[0].id).toArray()
  }, [client.id])
  const units = [...new Set(products.map((p) => p.business_unit))]
  const byId = new Map(products.map((p) => [p.id, p]))
  const list = products.filter((p) => (unit === 'todos' || p.business_unit === unit) && (!q || `${p.name} ${p.presentation} ${p.code ?? ''}`.toLowerCase().includes(q.toLowerCase())))
  const set = (id: string, n: number) => setCart({ ...cart, [id]: Math.max(0, n) })
  const packs = Object.values(cart).reduce((s, n) => s + n, 0)
  const total = Object.entries(cart).reduce((s, [id, n]) => s + n * Number(byId.get(id)?.price ?? 0), 0)

  if (products.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h2 className="text-[19px] font-semibold">Todavía no hay productos cargados</h2>
        <p className="text-[14px] text-muted">Administración tiene que cargar el catálogo. Mientras tanto, guardá la visita como “Interesado” con un comentario del pedido.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <h2 className="text-[22px] font-semibold tracking-tight">Pedido</h2>
        {last && last.length > 0 && packs === 0 && (
          <button
            onClick={() => {
              const next: Record<string, number> = {}
              for (const i of last) if (byId.has(i.product_id)) next[i.product_id] = i.packs
              setCart(next)
              toast({ title: 'Último pedido cargado', body: 'Ajustá cantidades si hace falta.' })
            }}
            className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3 text-left active:scale-[0.99]"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-on-accent">
              <RotateCcw size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-accent-ink">Repetir último pedido</span>
              <span className="block truncate text-[12.5px] text-ink-2">{last.map((i) => `${i.product_name} x${i.packs}`).join(' · ')}</span>
            </span>
          </button>
        )}
        {products.length > 8 && (
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-line bg-surface px-3.5">
            <Search size={16} className="text-muted" />
            <input id="cat-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
          </label>
        )}
        {units.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
            {(['todos', ...units] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={cn('h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] font-medium', unit === u ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink-2')}
              >
                {u === 'todos' ? 'Todo' : UNIT_NAME[u]}
              </button>
            ))}
          </div>
        )}
        <p className="text-[12px] text-muted">Precios de lista {settings.prices_include_vat ? 'con IVA' : 'sin IVA'}.</p>
      </div>
      <div className="flex flex-col gap-2 px-4 pt-2 pb-32">
        {list.map((p) => (
          <ProductRow key={p.id} p={p} n={cart[p.id] ?? 0} set={set} />
        ))}
      </div>
      <AnimatePresence>
        {packs > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="pb-safe sticky bottom-0 z-20 mt-auto border-t border-line bg-[color-mix(in_oklab,var(--surface)_95%,transparent)] px-4 pt-3 pb-3 backdrop-blur-md">
            <button onClick={onNext} className="flex h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 text-on-accent active:scale-[0.99]">
              <span className="text-[14px] font-medium opacity-90">
                {packs} {packs === 1 ? 'bulto' : 'bultos'}
              </span>
              <span className="text-[17px] font-semibold">Revisar {arsCompact(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductRow({ p, n, set }: { p: Product; n: number; set: (id: string, n: number) => void }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border bg-surface p-2.5 transition-colors', n > 0 ? 'border-accent' : 'border-line')}>
      <div className="grid size-12 shrink-0 place-items-center rounded-xl text-[11px] font-bold tracking-wider text-white" style={{ background: `var(--unit-${p.business_unit})` }}>
        {p.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold">{p.name}</div>
        <div className="truncate text-[12px] text-muted">
          {p.presentation ? `${p.presentation} · ` : ''}
          {ars(Number(p.price))}
        </div>
        {p.business_unit !== 'sauver' && <span className="rounded-full bg-surface-3 px-1.5 text-[11px] font-medium text-ink-2">{UNIT_NAME[p.business_unit]}</span>}
      </div>
      {n === 0 ? (
        <button onClick={() => set(p.id, 1)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink active:scale-95" aria-label={`Agregar ${p.name}`}>
          <Plus size={20} />
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-accent-soft p-1">
          <button onClick={() => set(p.id, n - 1)} className="grid size-9 place-items-center rounded-lg bg-surface text-ink active:scale-95" aria-label="Menos">
            <Minus size={16} />
          </button>
          <input
            inputMode="numeric"
            value={n}
            onChange={(e) => set(p.id, Number(e.target.value.replace(/\D/g, '')) || 0)}
            className="num w-9 bg-transparent text-center text-[16px] font-semibold text-accent-ink outline-none"
            aria-label="Cantidad"
          />
          <button onClick={() => set(p.id, n + 1)} className="grid size-9 place-items-center rounded-lg bg-accent text-on-accent active:scale-95" aria-label="Más">
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// ————— Resumen —————

function StepResumen({
  client,
  cart,
  busy,
  onSend,
}: {
  client: Customer
  cart: Record<string, number>
  busy: boolean
  onSend: (o: { paymentTerm: string; discountPct: number; maxDiscount: number; notes: string; lines: { product: Product; packs: number }[]; warehouse: string }) => void
}) {
  const products = useProducts() ?? []
  const settings = useSettings()
  const byId = new Map(products.map((p) => [p.id, p]))
  const lines = Object.entries(cart)
    .filter(([, n]) => n > 0)
    .map(([id, packs]) => ({ product: byId.get(id)!, packs }))
    .filter((l) => l.product)
  const [discount, setDiscount] = useState(0)
  const [term, setTerm] = useState(client.payment_term)
  const [notes, setNotes] = useState('')
  const terms = settings.payment_terms.includes(term) ? settings.payment_terms : [term, ...settings.payment_terms]
  const sub = (l: (typeof lines)[number]) => Math.round(l.packs * Number(l.product.price) * (1 - discount / 100))
  const total = lines.reduce((s, l) => s + sub(l), 0)
  const groups = (['sauver', 'joni', 'grower'] as UnitId[]).map((u) => ({ unit: u, lines: lines.filter((l) => l.product.business_unit === u) })).filter((g) => g.lines.length)
  const discounts = [...new Set([0, 2, 3, settings.max_discount, 10])].sort((a, b) => a - b)

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6">
      <h2 className="text-[22px] font-semibold tracking-tight">Revisar pedido</h2>
      {groups.map((g) => (
        <div key={g.unit} className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between bg-surface-2 px-4 py-2 text-[13px] font-semibold">
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: `var(--unit-${g.unit})` }} />
              {UNIT_NAME[g.unit]}
            </span>
            <span className="num">{ars(g.lines.reduce((s, l) => s + sub(l), 0))}</span>
          </div>
          {g.lines.map((l) => (
            <div key={l.product.id} className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[14px]">
              <span className="min-w-0 truncate">
                <span className="num font-semibold">{l.packs}×</span> {l.product.name}
                {l.product.presentation && <span className="text-muted"> · {l.product.presentation}</span>}
              </span>
              <span className="num shrink-0">{ars(sub(l))}</span>
            </div>
          ))}
        </div>
      ))}

      <Field label="Descuento">
        <div className="flex flex-wrap gap-2">
          {discounts.map((d) => (
            <button
              key={d}
              onClick={() => setDiscount(d)}
              className={cn('h-11 min-w-16 rounded-xl border px-3 text-[14px] font-medium', discount === d ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface')}
            >
              {d === 0 ? 'Sin desc.' : `${d} %`}
            </button>
          ))}
        </div>
        {discount > settings.max_discount && (
          <p className="text-[12.5px] text-warn-ink">Supera el {settings.max_discount} % autorizado: el pedido queda pendiente de aprobación de Gerencia.</p>
        )}
      </Field>

      <Field label="Condición de pago">
        <div className="flex flex-wrap gap-2">
          {terms.map((t) => (
            <button key={t} onClick={() => setTerm(t)} className={cn('h-10 rounded-full border px-4 text-[14px] font-medium', term === t ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-ink-2')}>
              {t}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Observaciones (opcional)">
        <input id="order-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Horario de entrega, pedido especial…" className={inputCls} />
      </Field>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="flex items-baseline justify-between px-1">
          <span className="text-[14px] text-muted">Total {settings.prices_include_vat ? 'con IVA' : 'sin IVA'}</span>
          <span className="num text-[26px] font-semibold tracking-tight">{ars(total)}</span>
        </div>
        <BigButton
          disabled={busy || lines.length === 0}
          onClick={() => onSend({ paymentTerm: term, discountPct: discount, maxDiscount: settings.max_discount, notes, lines, warehouse: settings.default_warehouse })}
        >
          Enviar pedido
        </BigButton>
        <p className="text-center text-[12px] text-muted">Llega a Administración al instante. Sin señal, se envía solo al volver.</p>
      </div>
    </div>
  )
}

// ————— Listo —————

function StepListo({ isNew, withOrder, photo, nextVisit, onHome, onAgain }: { isNew: boolean; withOrder: boolean; photo: boolean; nextVisit: number | null; onHome: () => void; onAgain: () => void }) {
  const lines = [
    'Visita registrada',
    ...(photo ? ['Foto guardada en el historial'] : []),
    ...(withOrder ? ['Pedido enviado a Administración'] : []),
    ...(nextVisit ? [`Revisita agendada para el ${dayMonth(addDays(today(), nextVisit))}`] : []),
  ]
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="grid size-24 place-items-center rounded-[32px] bg-accent text-on-accent shadow-[0_16px_40px_-10px_color-mix(in_oklab,var(--accent)_70%,transparent)]"
      >
        {withOrder ? <PartyPopper size={42} /> : <Check size={46} strokeWidth={2.6} />}
      </motion.div>
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight">{withOrder ? '¡Venta!' : 'Listo'}</h2>
        {isNew && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent-ink">
            <Sparkles size={16} /> {withOrder ? '+1 nuevo punto de venta' : '+1 prospecto'}
          </motion.p>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {lines.map((l, i) => (
          <motion.li key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }} className="flex items-center gap-2 text-[14.5px] text-ink-2">
            <CheckCircle2 size={17} className="text-good-ink" />
            {l}
          </motion.li>
        ))}
      </ul>
      <div className="flex w-full flex-col gap-2 pt-4">
        <BigButton onClick={onHome}>Volver a Hoy</BigButton>
        <button onClick={onAgain} className="h-12 rounded-2xl text-[15px] font-medium text-ink-2">
          Registrar otra visita
        </button>
      </div>
    </div>
  )
}

// ————— Piezas —————

const inputCls = 'h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-[16px] outline-none placeholder:text-muted focus:border-accent'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
    </div>
  )
}

function Chips({ options, value, onToggle, small }: { options: string[]; value: string[]; onToggle: (v: string) => void; small?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={cn(
              'rounded-full border px-4 font-medium transition-colors active:scale-95',
              small ? 'h-8 text-[13px]' : 'h-10 text-[14px]',
              on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-ink-2',
            )}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

function BigButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className="h-14 w-full rounded-2xl bg-accent text-[16px] font-semibold text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] disabled:opacity-35"
    >
      {children}
    </motion.button>
  )
}
