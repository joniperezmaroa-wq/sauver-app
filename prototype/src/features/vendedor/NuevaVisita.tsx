// Flujo de calle: cliente → foto → resultado → (pedido) → listo.
// Decisiones progresivas: cada paso pide solo lo que corresponde a la elección anterior.

import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
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
  ThumbsUp,
  UserPlus,
  X,
} from 'lucide-react'
import { CUSTOMERS, customer as getCustomer, type Channel, type Customer } from '@/data/customers'
import { PRODUCTS, UNITS, MAX_SELLER_DISCOUNT, product, type UnitId } from '@/data/catalog'
import { NEXT_VISIT_OPTIONS, NOT_INTERESTED_REASONS, OBJECTIONS, TODAY_ROUTE } from '@/data/seller'
import { ORDERS, itemTotal, paymentTermDays, type Order, type OrderItem } from '@/data/orders'
import { useApp } from '@/lib/store'
import { compressPhoto, type CompressedPhoto } from '@/lib/image'
import { Photo } from '@/components/ui/Photo'
import { ars, arsCompact, dayMonth } from '@/lib/format'
import { TODAY, addDays } from '@/lib/dates'
import { cn } from '@/lib/cn'

type Step = 'cliente' | 'prospecto' | 'foto' | 'resultado' | 'detalle' | 'pedido' | 'resumen' | 'listo'
type Outcome = 'compro' | 'interesado' | 'volver' | 'no_interesado' | 'no_hablo'

const OUTCOMES: { v: Outcome; label: string; sub: string; icon: typeof ThumbsUp; cls: string }[] = [
  { v: 'compro', label: 'Compró', sub: 'Armar el pedido', icon: ShoppingBag, cls: 'bg-accent text-on-accent' },
  { v: 'interesado', label: 'Interesado', sub: 'Qué le interesó', icon: Handshake, cls: 'bg-info-soft text-info-ink' },
  { v: 'volver', label: 'Volver', sub: 'Agendar revisita', icon: RotateCcw, cls: 'bg-warn-soft text-warn-ink' },
  { v: 'no_interesado', label: 'No interesado', sub: 'Por qué', icon: Frown, cls: 'bg-surface-3 text-ink-2' },
  { v: 'no_hablo', label: 'No pude hablar', sub: 'Sin datos', icon: MessageSquareOff, cls: 'bg-surface-3 text-ink-2' },
]

const CHANNELS: Channel[] = ['Kiosco', 'Tabaquería', 'Distribuidor', 'Growshop']
const ZONES = ['La Plata', 'City Bell', 'Tolosa', 'Berisso', 'San Telmo', 'Palermo']

export function NuevaVisita() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { state, dispatch, toast } = useApp()
  const pre = params.get('c')

  const [step, setStep] = useState<Step>(pre ? 'foto' : 'cliente')
  const [history, setHistory] = useState<Step[]>([])
  const [client, setClient] = useState<Customer | null>(pre ? getCustomer(pre) : null)
  const [isProspect, setIsProspect] = useState(false)
  const [photo, setPhoto] = useState<CompressedPhoto | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [interest, setInterest] = useState<string[]>([])
  const [objections, setObjections] = useState<string[]>([])
  const [reason, setReason] = useState<string | null>(null)
  const [nextVisit, setNextVisit] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)

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

  const items: OrderItem[] = Object.entries(cart)
    .filter(([, n]) => n > 0)
    .map(([id, packs]) => ({ productId: id, packs, listPrice: product(id).price, discountPct: product(id).unit === 'sauver' ? discount : 0 }))
  const total = items.reduce((s, i) => s + itemTotal(i), 0)
  const packs = items.reduce((s, i) => s + i.packs, 0)

  const finishVisit = (withOrder: boolean) => {
    dispatch({ type: 'visit/add' })
    if (withOrder && client) {
      const number = `P-${state.nextOrderNumber}`
      const now = new Date()
      const term = client.paymentTerm
      const order: Order = {
        id: `o-${state.nextOrderNumber}`,
        number,
        customerId: client.id,
        seller: 'Tomás',
        createdAt: now,
        status: 'enviado',
        billing: 'sin_facturar',
        collection: 'no_aplica',
        paymentTerm: term,
        expectedCollection: addDays(TODAY, 2 + paymentTermDays(term)),
        items,
        notes: notes || undefined,
        duxRefs: {},
        needsApproval: discount > MAX_SELLER_DISCOUNT ? `Descuento ${discount} % supera el autorizado` : undefined,
        events: [{ at: now, label: 'Pedido enviado desde el celular', by: 'Tomás' }],
        isNew: true,
      }
      dispatch({ type: 'order/add', order })
      setCreatedOrder(order)
    }
    go('listo')
  }

  const stepIndex = { cliente: 0, prospecto: 0, foto: 1, resultado: 2, detalle: 3, pedido: 3, resumen: 4, listo: 5 }[step]

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
          transition={{ duration: 0.18 }}
          className="flex flex-1 flex-col"
        >
          {step === 'cliente' && (
            <StepCliente
              onPick={(c) => {
                setClient(c)
                setIsProspect(c.state === 'Prospecto')
                go('foto')
              }}
              onNew={() => go('prospecto')}
            />
          )}
          {step === 'prospecto' && (
            <StepProspecto
              onCreate={(c) => {
                setClient(c)
                setIsProspect(true)
                go('foto')
              }}
            />
          )}
          {step === 'foto' && client && (
            <StepFoto
              client={client}
              photo={photo}
              setPhoto={setPhoto}
              onNext={() => go('resultado')}
            />
          )}
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
                    if (o.v === 'compro') go('pedido')
                    else go('detalle')
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
              onSave={() => finishVisit(false)}
            />
          )}
          {step === 'pedido' && client && (
            <StepPedido
              client={client}
              cart={cart}
              setCart={setCart}
              total={total}
              packs={packs}
              discount={discount}
              onNext={() => go('resumen')}
              onRepeat={() => {
                const last = ORDERS.find((o) => o.customerId === client.id)
                if (last) {
                  setCart(Object.fromEntries(last.items.map((i) => [i.productId, i.packs])))
                  toast({ title: 'Último pedido cargado', body: 'Ajustá cantidades si hace falta.' })
                }
              }}
            />
          )}
          {step === 'resumen' && client && (
            <StepResumen
              client={client}
              items={items}
              discount={discount}
              setDiscount={setDiscount}
              notes={notes}
              setNotes={setNotes}
              onSend={() => finishVisit(true)}
            />
          )}
          {step === 'listo' && (
            <StepListo
              isProspect={isProspect}
              order={createdOrder}
              photo={!!photo}
              outcome={outcome}
              nextVisit={nextVisit}
              onHome={() => nav('/v')}
              onAgain={() => nav('/v/visita', { replace: true, state: { t: Date.now() } })}
              onAdmin={() => nav('/a/pedidos')}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ————— Paso 1: cliente —————

function StepCliente({ onPick, onNew }: { onPick: (c: Customer) => void; onNew: () => void }) {
  const [q, setQ] = useState('')
  const mine = CUSTOMERS.filter((c) => c.owner === 'Tomás')
  const results = useMemo(
    () => (q ? mine.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.zone.toLowerCase().includes(q.toLowerCase())) : []),
    [q, mine],
  )
  const suggested = TODAY_ROUTE.map((r) => getCustomer(r.customerId))
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      <h2 className="text-[22px] font-semibold tracking-tight">¿Dónde estás?</h2>
      <label className="flex h-12 items-center gap-2 rounded-2xl border border-line-strong bg-surface px-4 focus-within:border-accent">
        <Search size={18} className="text-muted" />
        <input id="visit-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente o zona" className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted" />
      </label>
      <button onClick={onNew} className="flex h-14 items-center gap-3 rounded-2xl border-2 border-dashed border-line-strong px-4 text-left active:bg-surface-3">
        <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-ink">
          <UserPlus size={18} />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold">Nuevo prospecto</span>
          <span className="block text-[12.5px] text-muted">Solo nombre y canal; el resto después</span>
        </span>
      </button>
      <div className="text-[12px] font-medium tracking-wide text-muted uppercase">{q ? 'Resultados' : 'Sugeridos para hoy'}</div>
      <div className="flex flex-col gap-2">
        {(q ? results : suggested).map((c) => (
          <button key={c.id} onClick={() => onPick(c)} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 text-left active:scale-[0.99]">
            <Photo tone={c.photoTone} className="size-12 shrink-0 rounded-xl" showExample={false} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{c.name}</span>
              <span className="block truncate text-[12.5px] text-muted">
                {c.channel} · {c.zone}
              </span>
            </span>
          </button>
        ))}
        {q && results.length === 0 && <p className="py-6 text-center text-[13.5px] text-muted">No encontramos “{q}”. Crealo como prospecto.</p>}
      </div>
    </div>
  )
}

// ————— Paso 1b: prospecto nuevo —————

function StepProspecto({ onCreate }: { onCreate: (c: Customer) => void }) {
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<Channel | null>(null)
  const [zone, setZone] = useState<string | null>(null)
  const [wa, setWa] = useState('')
  const [contact, setContact] = useState('')
  const [more, setMore] = useState(false)
  const dup = name.length > 3 ? CUSTOMERS.find((c) => c.name.toLowerCase().includes(name.toLowerCase().slice(0, 6))) : undefined
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pt-5 pb-6">
      <h2 className="text-[22px] font-semibold tracking-tight">Nuevo prospecto</h2>
      <Field label="Nombre del comercio">
        <input id="p-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Kiosco Don Pepe" className="h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-[16px] outline-none focus:border-accent" />
      </Field>
      {dup && (
        <div className="-mt-3 rounded-xl bg-warn-soft px-3 py-2 text-[13px] text-ink-2">
          ¿Es <span className="font-semibold">{dup.name}</span> ({dup.zone})? Evitemos duplicados.
        </div>
      )}
      <Field label="Canal">
        <Chips options={CHANNELS} value={channel ? [channel] : []} onToggle={(v) => setChannel(v as Channel)} />
      </Field>
      <Field label="Zona">
        <Chips options={ZONES} value={zone ? [zone] : []} onToggle={setZone} />
      </Field>
      {more ? (
        <>
          <Field label="WhatsApp">
            <input id="p-wa" inputMode="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="221 555 0000" className="h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-[16px] outline-none focus:border-accent" />
          </Field>
          <Field label="Contacto">
            <input id="p-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nombre de quien atiende" className="h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-[16px] outline-none focus:border-accent" />
          </Field>
        </>
      ) : (
        <button onClick={() => setMore(true)} className="self-start text-[14px] font-medium text-accent-ink">
          + Agregar WhatsApp y contacto
        </button>
      )}
      <div className="mt-auto pt-4">
        <BigButton
          disabled={!name.trim() || !channel}
          onClick={() => {
            const c: Customer = {
              ...getCustomer('c-estacion'),
              id: `c-nuevo-${Date.now()}`,
              name: name.trim(),
              channel: channel!,
              zone: zone ?? 'Sin zona',
              address: zone ?? 'Sin dirección',
              whatsapp: wa,
              contact,
              state: 'Prospecto',
              photoTone: '#46524c',
            }
            // Prototipo: el prospecto queda disponible en la sesión (en producción se guarda en la base).
            CUSTOMERS.push(c)
            onCreate(c)
          }}
        >
          Continuar
        </BigButton>
      </div>
    </div>
  )
}

// ————— Paso 2: foto —————

function StepFoto({ client, photo, setPhoto, onNext }: { client: Customer; photo: CompressedPhoto | null; setPhoto: (p: CompressedPhoto | null) => void; onNext: () => void }) {
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
          }
        }}
      />
      <button onClick={() => input.current?.click()} className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] border-2 border-dashed border-line-strong bg-surface-2">
        {photo ? (
          <img src={photo.url} alt="Foto de la visita" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-3 text-ink-2">
            <span className="grid size-16 place-items-center rounded-3xl bg-accent text-on-accent">{busy ? <Clock3 size={28} /> : <Camera size={30} />}</span>
            <span className="text-[16px] font-semibold">{busy ? 'Comprimiendo…' : 'Sacar foto'}</span>
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
      {!photo && client.state !== 'Prospecto' && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <Photo tone={client.photoTone} className="h-14 w-20 shrink-0 rounded-xl" showExample={false} />
          <span className="text-[13px] text-muted">Última foto: hace {client.lastPurchaseDaysAgo ?? 20} días</span>
        </div>
      )}
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <BigButton onClick={onNext}>{photo ? 'Continuar' : 'Seguir sin foto'}</BigButton>
      </div>
    </div>
  )
}

// ————— Paso 3b: detalle según resultado —————

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
  onSave: () => void
}) {
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const title = { interesado: 'Interesado', volver: 'Volver', no_interesado: 'No interesado', no_hablo: 'No pudiste hablar', compro: '' }[p.outcome]
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pt-5 pb-6">
      <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
      {p.outcome === 'interesado' && (
        <>
          <Field label="¿Qué le interesó?">
            <Chips
              options={PRODUCTS.filter((x) => x.unit === 'sauver').map((x) => x.name.replace('Sauver ', ''))}
              value={p.interest}
              onToggle={(v) => p.setInterest(toggle(p.interest, v))}
            />
          </Field>
          <Field label="Objeciones">
            <Chips options={OBJECTIONS} value={p.objections} onToggle={(v) => p.setObjections(toggle(p.objections, v))} />
          </Field>
        </>
      )}
      {p.outcome === 'no_interesado' && (
        <Field label="Motivo">
          <Chips options={NOT_INTERESTED_REASONS} value={p.reason ? [p.reason] : []} onToggle={p.setReason} />
        </Field>
      )}
      {p.outcome !== 'no_interesado' && (
        <Field label={p.outcome === 'no_hablo' ? '¿Volver?' : 'Próxima visita'}>
          <div className="grid grid-cols-3 gap-2">
            {NEXT_VISIT_OPTIONS.map((o) => (
              <button
                key={o.days}
                onClick={() => p.setNextVisit(p.nextVisit === o.days ? null : o.days)}
                className={cn(
                  'flex h-16 flex-col items-center justify-center rounded-2xl border text-[14px] font-medium transition-colors',
                  p.nextVisit === o.days ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface',
                )}
              >
                {o.label}
                <span className="text-[11.5px] font-normal text-muted">{dayMonth(addDays(TODAY, o.days))}</span>
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Comentario (opcional)">
        <textarea
          id="visit-comment"
          value={p.comment}
          onChange={(e) => p.setComment(e.target.value)}
          rows={3}
          placeholder="Algo que convenga recordar"
          className="w-full resize-none rounded-2xl border border-line-strong bg-surface px-4 py-3 text-[16px] outline-none focus:border-accent"
        />
      </Field>
      <div className="mt-auto pt-2">
        <BigButton onClick={p.onSave}>Guardar visita</BigButton>
      </div>
    </div>
  )
}

// ————— Paso 4: pedido (catálogo) —————

function StepPedido({
  client,
  cart,
  setCart,
  total,
  packs,
  discount,
  onNext,
  onRepeat,
}: {
  client: Customer
  cart: Record<string, number>
  setCart: (c: Record<string, number>) => void
  total: number
  packs: number
  discount: number
  onNext: () => void
  onRepeat: () => void
}) {
  const [unit, setUnit] = useState<'todos' | UnitId>('todos')
  const last = ORDERS.find((o) => o.customerId === client.id)
  const favorites = new Set(client.topProducts.map((t) => t.productId))
  const list = PRODUCTS.filter((p) => unit === 'todos' || p.unit === unit).sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)))
  const set = (id: string, n: number) => setCart({ ...cart, [id]: Math.max(0, n) })

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <h2 className="text-[22px] font-semibold tracking-tight">Pedido</h2>
        {last && packs === 0 && (
          <button onClick={onRepeat} className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3 text-left active:scale-[0.99]">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-on-accent">
              <RotateCcw size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-accent-ink">Repetir último pedido</span>
              <span className="block truncate text-[12.5px] text-ink-2">
                {last.items.map((i) => `${product(i.productId).name.replace('Sauver ', '')} x${i.packs}`).join(' · ')}
              </span>
            </span>
          </button>
        )}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
          {(['todos', 'sauver', 'joni', 'grower'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={cn(
                'h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] font-medium',
                unit === u ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink-2',
              )}
            >
              {u === 'todos' ? 'Todo' : UNITS[u].name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 px-4 pt-3 pb-32">
        {list.map((p) => {
          const n = cart[p.id] ?? 0
          return (
            <div key={p.id} className={cn('flex items-center gap-3 rounded-2xl border bg-surface p-2.5 transition-colors', n > 0 ? 'border-accent' : 'border-line')}>
              <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: `linear-gradient(150deg, color-mix(in oklab, ${p.tone} 55%, white), ${p.tone})` }}>
                <span className="text-[11px] font-bold tracking-wider text-white/90">{p.unit === 'sauver' ? 'SV' : UNITS[p.unit].short}</span>
                {favorites.has(p.id) && <span className="absolute top-1 right-1 size-2 rounded-full bg-white" title="Suele comprarlo" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-semibold">{p.name}</div>
                <div className="truncate text-[12px] text-muted">
                  {p.pack} · {ars(p.price)}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px]">
                  {p.unit !== 'sauver' && <span className="rounded-full bg-surface-3 px-1.5 font-medium text-ink-2">{UNITS[p.unit].name}</span>}
                  {p.stock === 'bajo' && <span className="text-warn-ink">Poco stock</span>}
                  {favorites.has(p.id) && <span className="text-accent-ink">Suele llevar</span>}
                </div>
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
                  <motion.span key={n} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="num w-7 text-center text-[16px] font-semibold text-accent-ink">
                    {n}
                  </motion.span>
                  <button onClick={() => set(p.id, n + 1)} className="grid size-9 place-items-center rounded-lg bg-accent text-on-accent active:scale-95" aria-label="Más">
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <AnimatePresence>
        {packs > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="pb-safe sticky bottom-0 z-20 mt-auto border-t border-line bg-[color-mix(in_oklab,var(--surface)_95%,transparent)] px-4 pt-3 pb-3 backdrop-blur-md"
          >
            <button onClick={onNext} className="flex h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 text-on-accent active:scale-[0.99]">
              <span className="text-[14px] font-medium opacity-90">
                {packs} {packs === 1 ? 'bulto' : 'bultos'}
                {discount > 0 && ` · −${discount} %`}
              </span>
              <span className="text-[17px] font-semibold">Revisar {arsCompact(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ————— Paso 5: resumen —————

function StepResumen({
  client,
  items,
  discount,
  setDiscount,
  notes,
  setNotes,
  onSend,
}: {
  client: Customer
  items: OrderItem[]
  discount: number
  setDiscount: (n: number) => void
  notes: string
  setNotes: (s: string) => void
  onSend: () => void
}) {
  const groups = (['sauver', 'joni', 'grower'] as UnitId[])
    .map((u) => ({ unit: u, items: items.filter((i) => product(i.productId).unit === u) }))
    .filter((g) => g.items.length)
  const total = items.reduce((s, i) => s + itemTotal(i), 0)
  const days = paymentTermDays(client.paymentTerm)
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-6">
      <h2 className="text-[22px] font-semibold tracking-tight">Revisar pedido</h2>
      {groups.map((g) => {
        const sub = g.items.reduce((s, i) => s + itemTotal(i), 0)
        return (
          <div key={g.unit} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between bg-surface-2 px-4 py-2 text-[13px] font-semibold">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: `var(--unit-${g.unit})` }} />
                {UNITS[g.unit].name}
              </span>
              <span className="num">{ars(sub)}</span>
            </div>
            {g.items.map((i) => (
              <div key={i.productId} className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[14px]">
                <span className="min-w-0 truncate">
                  <span className="num font-semibold">{i.packs}×</span> {product(i.productId).name}
                </span>
                <span className="num shrink-0">{ars(itemTotal(i))}</span>
              </div>
            ))}
          </div>
        )
      })}

      <Field label="Descuento Sauver">
        <div className="grid grid-cols-4 gap-2">
          {[0, 5, 10, 15].map((d) => (
            <button
              key={d}
              onClick={() => setDiscount(d)}
              className={cn(
                'h-11 rounded-xl border text-[14px] font-medium',
                discount === d ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface',
              )}
            >
              {d === 0 ? 'Sin desc.' : `${d} %`}
            </button>
          ))}
        </div>
        {discount > MAX_SELLER_DISCOUNT && (
          <p className="mt-2 text-[12.5px] text-warn-ink">Supera el {MAX_SELLER_DISCOUNT} % autorizado: el pedido queda pendiente de aprobación de Joni.</p>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-surface-2 px-4 py-3">
          <div className="text-[12px] text-muted">Condición</div>
          <div className="text-[15px] font-semibold">{client.paymentTerm}</div>
        </div>
        <div className="rounded-2xl bg-surface-2 px-4 py-3">
          <div className="text-[12px] text-muted">Cobro esperado</div>
          <div className="text-[15px] font-semibold">{days ? `≈ ${dayMonth(addDays(TODAY, 2 + days))}` : 'Contra entrega'}</div>
        </div>
      </div>

      <Field label="Observaciones (opcional)">
        <input
          id="order-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Horario de entrega, pedido especial…"
          className="h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-[16px] outline-none focus:border-accent"
        />
      </Field>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="flex items-baseline justify-between px-1">
          <span className="text-[14px] text-muted">Total</span>
          <span className="num text-[26px] font-semibold tracking-tight">{ars(total)}</span>
        </div>
        <BigButton onClick={onSend}>Enviar pedido</BigButton>
        <p className="text-center text-[12px] text-muted">Llega al instante a Administración. Si no hay señal, se envía solo al volver.</p>
      </div>
    </div>
  )
}

// ————— Paso final —————

function StepListo({
  isProspect,
  order,
  photo,
  outcome,
  nextVisit,
  onHome,
  onAgain,
  onAdmin,
}: {
  isProspect: boolean
  order: Order | null
  photo: boolean
  outcome: Outcome | null
  nextVisit: number | null
  onHome: () => void
  onAgain: () => void
  onAdmin: () => void
}) {
  const lines = [
    'Visita registrada',
    ...(photo ? ['Foto guardada en el historial'] : []),
    ...(order ? [`Pedido ${order.number} enviado a Administración`] : []),
    ...(nextVisit ? [`Revisita agendada para el ${dayMonth(addDays(TODAY, nextVisit))}`] : []),
  ]
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="grid size-24 place-items-center rounded-[32px] bg-accent text-on-accent shadow-[0_16px_40px_-10px_color-mix(in_oklab,var(--accent)_70%,transparent)]"
      >
        {outcome === 'compro' ? <PartyPopper size={42} /> : <Check size={46} strokeWidth={2.6} />}
      </motion.div>
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight">{outcome === 'compro' ? '¡Venta!' : 'Listo'}</h2>
        {isProspect && outcome === 'compro' && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent-ink">
            <Sparkles size={16} /> +1 nuevo punto de venta
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
        {order && (
          <button onClick={onAdmin} className="text-[13px] text-accent-ink underline-offset-2 hover:underline">
            Prototipo: ver el pedido en el tablero de Administración →
          </button>
        )}
      </div>
    </div>
  )
}

// ————— Piezas —————

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
    </div>
  )
}

function Chips({ options, value, onToggle }: { options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={cn(
              'h-10 rounded-full border px-4 text-[14px] font-medium transition-colors active:scale-95',
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

function BigButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
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
