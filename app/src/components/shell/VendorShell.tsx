import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Home, KanbanSquare, Plus, User, Users } from 'lucide-react'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/v', label: 'Hoy', icon: Home },
  { to: '/v/clientes', label: 'Clientes', icon: Users },
  { to: '/v/pedidos', label: 'Pedidos', icon: KanbanSquare },
  { to: '/v/yo', label: 'Yo', icon: User },
]

/** Experiencia del vendedor: pensada para el celular; en pantallas grandes se centra. */
export function VendorShell() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const inFlow = pathname.startsWith('/v/visita') || pathname.endsWith('/editar') || pathname.endsWith('/nuevo')

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 })
  }, [pathname])

  const Tab = ({ to, label, icon: Icon }: (typeof TABS)[number]) => (
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
    <div className="flex h-full justify-center bg-bg">
      <div className="pt-safe relative flex h-full w-full max-w-[480px] flex-col overflow-hidden md:border-x md:border-line">
        <div ref={ref} id="vendor-scroll" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <motion.div
            key={pathname.split('/').slice(0, 3).join('/')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="@container min-h-full"
          >
            <Outlet />
          </motion.div>
        </div>
        {!inFlow && (
          <nav className="pb-safe relative z-20 shrink-0 border-t border-line bg-[color-mix(in_oklab,var(--surface)_94%,transparent)] backdrop-blur-md">
            <div className="grid h-[64px] grid-cols-5">
              {TABS.slice(0, 2).map((t) => (
                <Tab key={t.to} {...t} />
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
              {TABS.slice(2).map((t) => (
                <Tab key={t.to} {...t} />
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
