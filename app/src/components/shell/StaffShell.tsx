import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  CalendarCheck,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Logo } from './Logo'
import { SyncChip } from './SyncChip'
import { ThemeSwitch } from './ThemeSwitch'
import { Sheet } from '@/components/ui/Sheet'
import { useAuth, useMe } from '@/lib/auth'
import { db } from '@/lib/db'
import { cn } from '@/lib/cn'

interface Item {
  to: string
  label: string
  icon: LucideIcon
  badge?: 'nuevos' | 'aprobar'
}

export function staffBase(role: string) {
  return role === 'gerencia' ? '/g' : '/a'
}

function navFor(role: string): Item[] {
  const b = staffBase(role)
  const items: Item[] = [
    role === 'gerencia'
      ? { to: b, label: 'Inicio', icon: LayoutDashboard, badge: 'aprobar' }
      : { to: b, label: 'Hoy', icon: CalendarCheck },
    { to: `${b}/pedidos`, label: 'Pedidos', icon: KanbanSquare, badge: 'nuevos' },
    { to: `${b}/clientes`, label: 'Clientes', icon: Users },
    { to: `${b}/productos`, label: 'Productos', icon: Package },
  ]
  if (role === 'gerencia') items.push({ to: `${b}/usuarios`, label: 'Usuarios', icon: UserCog })
  items.push({ to: `${b}/ajustes`, label: 'Ajustes', icon: Settings })
  return items
}

function useBadges() {
  return (
    useLiveQuery(async () => {
      const orders = await db.orders.toArray()
      return {
        nuevos: orders.filter((o) => o.status === 'nuevo').length,
        aprobar: orders.filter((o) => o.needs_approval && o.status !== 'cancelado').length,
      }
    }, []) ?? { nuevos: 0, aprobar: 0 }
  )
}

export function StaffShell() {
  const me = useMe()
  const { signOut } = useAuth()
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  const items = navFor(me.role)
  const badges = useBadges()
  const title = [...items].sort((a, b) => b.to.length - a.to.length).find((i) => pathname === i.to || pathname.startsWith(i.to + '/'))?.label

  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 })
  }, [pathname])

  const Row = ({ i, onClick }: { i: Item; onClick?: () => void }) => {
    const count = i.badge ? badges[i.badge] : 0
    return (
      <NavLink
        to={i.to}
        end={i.to.length <= 2}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            'flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors',
            isActive ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)]' : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
          )
        }
      >
        {({ isActive }) => (
          <>
            <i.icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent' : 'text-muted'} />
            <span className="flex-1">{i.label}</span>
            {count > 0 && (
              <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-on-accent">{count}</span>
            )}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <div className="flex h-full">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-line bg-bg px-3 pt-4 pb-3 lg:flex">
        <div className="flex h-9 items-center px-2">
          <Logo />
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-0.5">
          {items.map((i) => (
            <Row key={i.to} i={i} />
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <span className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-bg">{me.full_name.slice(0, 1) || '?'}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium">{me.full_name || me.email}</span>
              <span className="block truncate text-[12px] text-muted">{me.role === 'gerencia' ? 'Gerencia' : 'Administración'}</span>
            </span>
            <button onClick={() => void signOut()} title="Cerrar sesión" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-ink">
              <LogOut size={16} />
            </button>
          </div>
          <ThemeSwitch className="self-start" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="pt-safe sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            <button className="lg:hidden" onClick={() => setMenu(true)} aria-label="Menú">
              <Menu size={20} className="text-ink-2" />
            </button>
            <span className="lg:hidden">
              <Logo compact />
            </span>
            <h1 className="truncate text-[15px] font-semibold md:text-[16px]">{title}</h1>
            <div className="flex-1" />
            <SyncChip />
          </div>
        </header>
        <main id="main-scroll" className="min-h-0 flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="@container mx-auto w-full max-w-[1320px] px-4 pt-5 pb-28 md:px-6 md:pt-6 lg:pb-10"
          >
            <Outlet />
          </motion.div>
        </main>
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[color-mix(in_oklab,var(--surface)_92%,transparent)] backdrop-blur-md lg:hidden">
          <div className="grid h-16 grid-cols-5">
            {items.slice(0, 4).map((i) => {
              const count = i.badge ? badges[i.badge] : 0
              return (
                <NavLink
                  key={i.to}
                  to={i.to}
                  end={i.to.length <= 2}
                  className={({ isActive }) => cn('flex flex-col items-center justify-center gap-1 text-[10.5px]', isActive ? 'font-medium text-ink' : 'text-muted')}
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative">
                        <i.icon size={21} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent' : ''} />
                        {count > 0 && (
                          <span className="num absolute -top-1.5 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent">
                            {count}
                          </span>
                        )}
                      </span>
                      {i.label}
                    </>
                  )}
                </NavLink>
              )
            })}
            <button onClick={() => setMenu(true)} className="flex flex-col items-center justify-center gap-1 text-[10.5px] text-muted">
              <Menu size={21} strokeWidth={1.8} />
              Más
            </button>
          </div>
        </nav>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Menú" eyebrow={me.full_name || me.email}>
        <div className="flex flex-col gap-1 p-4">
          {items.map((i) => (
            <Row key={i.to} i={i} onClick={() => setMenu(false)} />
          ))}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-4">
            <ThemeSwitch />
            <button onClick={() => void signOut()} className="inline-flex items-center gap-2 text-[14px] text-ink-2">
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
