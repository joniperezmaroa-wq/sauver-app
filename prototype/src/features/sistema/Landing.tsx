import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Briefcase, ClipboardCheck, Monitor, Palette, Smartphone } from 'lucide-react'
import { Logo, ThemeSwitch } from '@/components/shell/AppShell'
import { writePref } from '@/lib/storage'
import type { Role } from '@/data/people'
import { BASE } from '@/components/shell/nav'

const ROLES: { role: Role; title: string; who: string; body: string; icon: typeof Briefcase; devices: string }[] = [
  {
    role: 'gerencia',
    title: 'Gerencia',
    who: 'Joni',
    body: 'Excepciones, decisiones, punto de equilibrio, caja proyectada y drill-down hasta el origen del dato.',
    icon: Briefcase,
    devices: 'Computadora y celular',
  },
  {
    role: 'admin',
    title: 'Administración',
    who: 'Carla (ficticia)',
    body: '¿Qué hay que hacer hoy? Control diario WhatsApp → Dux, tareas, pedidos, cobranzas y pagos.',
    icon: ClipboardCheck,
    devices: 'Computadora y celular',
  },
  {
    role: 'vendedor',
    title: 'Vendedor',
    who: 'Tomás (ficticio)',
    body: 'Plan del día, visita en tres toques, foto, resultado y pedido completo desde el teléfono.',
    icon: Smartphone,
    devices: 'Celular',
  },
]

export function Landing() {
  const nav = useNavigate()
  const enter = (r: Role) => {
    writePref('role', r)
    nav(BASE[r])
  }
  return (
    <div className="min-h-full overflow-y-auto bg-bg">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] opacity-70"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 0%, var(--accent-soft), transparent 70%)' }}
      />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 pt-[max(24px,env(safe-area-inset-top))] pb-12 md:px-6 md:pt-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeSwitch />
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium text-ink-2">
            <span className="size-1.5 rounded-full bg-prov" />
            Fase 1 · prototipo navegable con datos ficticios
          </span>
          <h1 className="mt-4 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] md:text-[46px]">
            La capa de gestión de SAUVER, arriba de Dux.
          </h1>
          <p className="mt-3 max-w-xl text-[15.5px] text-ink-2">
            Tres experiencias sobre la misma plataforma. Elegí con qué rol entrar; desde adentro podés cambiar de vista en cualquier momento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {ROLES.map((r, i) => (
            <motion.button
              key={r.role}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06 }}
              onClick={() => enter(r.role)}
              className="group flex flex-col gap-4 rounded-[22px] border border-line bg-surface p-5 text-left shadow-[var(--shadow-card)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-line-strong"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
                  <r.icon size={21} />
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                  {r.devices === 'Celular' ? <Smartphone size={13} /> : <Monitor size={13} />}
                  {r.devices}
                </span>
              </div>
              <div>
                <div className="text-[19px] font-semibold tracking-tight">{r.title}</div>
                <div className="text-[13px] text-muted">{r.who}</div>
              </div>
              <p className="text-[14px] text-ink-2">{r.body}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink">
                Entrar <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.button>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <button onClick={() => nav('/sistema')} className="inline-flex items-center gap-2 text-[14px] font-medium text-ink-2 hover:text-ink">
            <Palette size={17} /> Ver el sistema de diseño y el lenguaje Real / Proyectado / Provisional
          </button>
          <p className="max-w-md text-[12.5px] text-muted">
            Todos los clientes, montos, pedidos y personas (salvo Joni) son ficticios. No hay conexión con Dux ni lógica financiera definitiva.
          </p>
        </div>
      </div>
    </div>
  )
}
