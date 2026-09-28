// Contenedor de la experiencia del vendedor. En el celular ocupa toda la pantalla;
// en computadora se muestra dentro de un marco de teléfono para evaluarla tal como se usa.

import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, QrCode, Smartphone } from 'lucide-react'
import { NAV } from '@/components/shell/nav'
import { Logo, RoleSwitcher, ThemeSwitch } from '@/components/shell/AppShell'
import { Toaster } from '@/components/ui/Toaster'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/cn'
import { PortalCtx } from '@/lib/portal'


export function VendorShell() {
  const desktop = useMediaQuery('(min-width: 900px)')
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  const { pathname } = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const inFlow = pathname.startsWith('/v/visita')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  const app = (
    <div ref={setFrame} className="relative flex h-full flex-col overflow-hidden bg-bg">
      <PortalCtx.Provider value={desktop ? frame : null}>
        <div ref={scrollRef} id="vendor-scroll" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <motion.div
              key={pathname.split('/').slice(0, 3).join('/')}
              initial={{ opacity: 0, x: inFlow ? 24 : 0, y: inFlow ? 0 : 6 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              className="@container min-h-full"
            >
              <Outlet />
            </motion.div>
        </div>
        {!inFlow && <VendorTabs />}
      </PortalCtx.Provider>
    </div>
  )

  if (!desktop) {
    return (
      <div className="h-full">
        {app}
        <Toaster />
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center gap-12 overflow-auto bg-[radial-gradient(ellipse_at_top,var(--accent-soft),transparent_60%)] p-6">
      <aside className="hidden w-[300px] shrink-0 flex-col gap-6 xl:flex">
        <Logo />
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent-ink">
            <Smartphone size={14} /> Experiencia mobile
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Vendedor en la calle</h1>
          <p className="mt-2 text-[14px] text-ink-2">
            Diseñada para usarse con una mano, con mala señal y en menos de un minuto por visita. Para evaluarla de verdad, abrí este mismo enlace en tu celular.
          </p>
        </div>
        <ol className="flex flex-col gap-2 text-[13.5px] text-ink-2">
          {['Hoy: plan del día y objetivos', 'Tocá + para registrar una visita', 'Elegí “Compró” para armar el pedido', 'Mirá el pedido llegar a Administración'].map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-surface text-[12px] font-semibold shadow-[var(--shadow-card)]">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <div className="text-[12px] font-medium tracking-wide text-muted uppercase">Ver como</div>
          <RoleSwitcher role="vendedor" />
          <ThemeSwitch className="self-start" />
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <QrCode size={14} /> En producción se instala como app (PWA) desde el navegador.
        </div>
      </aside>
      <div className="relative shrink-0 rounded-[52px] bg-[#0b0f0d] p-[11px] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]">
        <div className="absolute top-[22px] left-1/2 z-20 h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-black" />
        <div
          className="relative overflow-hidden rounded-[42px] [transform:translateZ(0)]"
          style={{ width: 390, height: 'min(844px, calc(100vh - 70px))' }}
        >
          <div className="h-full pt-[40px]">{app}</div>
          <div className="pointer-events-none absolute top-0 inset-x-0 z-10 flex h-[40px] items-center justify-between bg-bg px-8 text-[13px] font-semibold">
            <span>10:24</span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="inline-block h-2.5 w-4 rounded-[3px] border border-current" />
            </span>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

function VendorTabs() {
  const nav = useNavigate()
  const items = NAV.vendedor
  const left = items.slice(0, 2)
  const right = items.slice(2)
  const Tab = ({ to, label, icon: Icon }: (typeof items)[number]) => (
    <NavLink to={to} end={to === '/v'} className={({ isActive }) => cn('flex flex-col items-center justify-center gap-1 text-[10.5px]', isActive ? 'font-medium text-ink' : 'text-muted')}>
      {({ isActive }) => (
        <>
          <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent' : ''} />
          {label}
        </>
      )}
    </NavLink>
  )
  return (
    <nav className="pb-safe relative z-20 shrink-0 border-t border-line bg-[color-mix(in_oklab,var(--surface)_94%,transparent)] backdrop-blur-md">
      <div className="grid h-[64px] grid-cols-5">
        {left.map((i) => (
          <Tab key={i.to} {...i} />
        ))}
        <div className="relative flex justify-center">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => nav('/v/visita')}
            aria-label="Nueva visita"
            className="absolute -top-5 grid size-[60px] place-items-center rounded-[20px] bg-accent text-on-accent shadow-[0_10px_24px_-6px_color-mix(in_oklab,var(--accent)_70%,transparent)]"
          >
            <Plus size={28} strokeWidth={2.4} />
          </motion.button>
        </div>
        {right.map((i) => (
          <Tab key={i.to} {...i} />
        ))}
      </div>
    </nav>
  )
}
