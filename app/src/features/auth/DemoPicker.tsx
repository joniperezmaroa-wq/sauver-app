import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Briefcase, ClipboardCheck, RotateCcw, Smartphone } from 'lucide-react'
import { Logo } from '@/components/shell/Logo'
import { useAuth } from '@/lib/auth'
import { seedDemo } from '@/lib/demo'
import { useToast } from '@/lib/toast'

const ROLES = [
  { role: 'vendedor' as const, title: 'Vendedor', who: 'Ezequiel', body: 'Visitas, fotos y pedidos desde la calle.', icon: Smartphone },
  { role: 'admin' as const, title: 'Administración', who: 'Yamila', body: 'Recibe los pedidos, los carga en Dux y los avanza.', icon: ClipboardCheck },
  { role: 'gerencia' as const, title: 'Gerencia', who: 'Joni', body: 'Ve todo y aprueba descuentos fuera de rango.', icon: Briefcase },
]

/** Pantalla de entrada del modo demo: elegir con qué rol probar. */
export function DemoPicker() {
  const { enterDemo } = useAuth()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-10">
        <Logo />
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-prov-soft px-3 py-1 text-[12px] font-medium text-prov">Modo demo · sin servidor</span>
          <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-[-0.02em]">Probá la app como cada uno</h1>
          <p className="mt-2 text-[14.5px] text-ink-2">
            Es la app real con datos de ejemplo guardados solo en este teléfono. Mandá un pedido como vendedor y después entrá como Administración para recibirlo.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {ROLES.map((r, i) => (
            <motion.button
              key={r.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => enterDemo(r.role)}
              className="flex items-center gap-4 rounded-[20px] border border-line bg-surface p-4 text-left active:scale-[0.99]"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
                <r.icon size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold">{r.title}</span>
                <span className="block text-[13px] text-muted">
                  {r.who} · {r.body}
                </span>
              </span>
              <ArrowRight size={18} className="text-muted" />
            </motion.button>
          ))}
        </div>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-2 self-start text-[13.5px] text-ink-2">
            <RotateCcw size={15} /> Borrar lo que cargué y empezar de cero
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-crit-soft p-3 text-[13.5px]">
            <span className="flex-1 text-crit-ink">Se borran visitas, clientes y pedidos de prueba.</span>
            <button onClick={() => setConfirm(false)} className="font-medium text-ink-2">
              No
            </button>
            <button
              onClick={async () => {
                await seedDemo(true)
                setConfirm(false)
                toast({ title: 'Datos de demo reiniciados' })
              }}
              className="font-semibold text-crit-ink"
            >
              Borrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
