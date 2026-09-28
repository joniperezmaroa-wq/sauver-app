import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Check, ChevronsUpDown, Menu, Monitor, Moon, Search, Sun } from 'lucide-react'
import { NAV, MOBILE_TABS, BASE, type NavItem } from './nav'
import { CommandPalette } from './CommandPalette'
import { USERS, type Role } from '@/data/people'
import { useApp } from '@/lib/store'
import { useTheme, type ThemePref } from '@/lib/theme'
import { Sheet } from '@/components/ui/Sheet'
import { Toaster } from '@/components/ui/Toaster'
import { DataFreshness } from './DataFreshness'
import { cn } from '@/lib/cn'
import { writePref } from '@/lib/storage'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <rect width="26" height="26" rx="7.5" fill="var(--accent)" />
        <path
          d="M17.2 8.6c-.9-1-2.3-1.6-4-1.6-2.5 0-4.2 1.3-4.2 3.2 0 4.2 8.4 2.5 8.4 6.3 0 1.9-1.8 3.2-4.3 3.2-1.8 0-3.3-.7-4.2-1.8"
          fill="none"
          stroke="var(--on-accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && <span className="text-[14px] font-semibold tracking-[0.16em]">SAUVER</span>}
    </span>
  )
}

function useBadges() {
  const { state } = useApp()
  return {
    decisiones: state.decisions.filter((d) => d.status === 'pendiente').length,
    pedidos: state.orders.filter((o) => o.status === 'enviado').length,
    tareas: state.tasks.filter((t) => !t.done && t.due <= new Date(2026, 8, 28)).length,
  }
}

function NavRow({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const badges = useBadges()
  const count = item.badge ? badges[item.badge] : 0
  const isRoot = Object.values(BASE).includes(item.to)
  return (
    <NavLink
      to={item.to}
      end={isRoot}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group relative flex h-9 items-center gap-3 rounded-[10px] px-3 text-[13.5px] transition-colors',
          isActive ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)]' : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent' : 'text-muted group-hover:text-ink-2'} />
          <span className="flex-1 truncate">{item.label}</span>
          {item.phase && <span className="text-[10.5px] text-muted opacity-0 group-hover:opacity-100">{item.phase}</span>}
          {count > 0 && (
            <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-on-accent">
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const items = NAV[role]
  const groups: (string | undefined)[] = []
  items.forEach((i) => !groups.includes(i.group) && groups.push(i.group))
  return (
    <nav className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g ?? 'main'} className="flex flex-col gap-0.5">
          {g && <div className="px-3 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">{g}</div>}
          {items
            .filter((i) => i.group === g)
            .map((i) => (
              <NavRow key={i.to} item={i} onClick={onNavigate} />
            ))}
        </div>
      ))}
    </nav>
  )
}

export function ThemeSwitch({ className }: { className?: string }) {
  const { pref, setPref } = useTheme()
  const opts: { v: ThemePref; icon: typeof Sun; label: string }[] = [
    { v: 'light', icon: Sun, label: 'Claro' },
    { v: 'system', icon: Monitor, label: 'Sistema' },
    { v: 'dark', icon: Moon, label: 'Oscuro' },
  ]
  return (
    <div className={cn('inline-flex rounded-[10px] bg-surface-3 p-0.5', className)} role="radiogroup" aria-label="Tema">
      {opts.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={pref === o.v}
          title={o.label}
          onClick={() => setPref(o.v)}
          className={cn(
            'grid h-7 w-8 place-items-center rounded-[8px] transition-colors',
            pref === o.v ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]' : 'text-muted hover:text-ink-2',
          )}
        >
          <o.icon size={14} />
        </button>
      ))}
    </div>
  )
}

export function RoleSwitcher({ role, onDone }: { role: Role; onDone?: () => void }) {
  const nav = useNavigate()
  return (
    <div className="flex flex-col gap-1">
      {(Object.keys(USERS) as Role[]).map((r) => {
        const u = USERS[r]
        return (
          <button
            key={r}
            onClick={() => {
              writePref('role', r)
              nav(BASE[r])
              onDone?.()
            }}
            className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-3', r === role && 'bg-surface-3')}
          >
            <span className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-bg">{u.initials}</span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium">{u.roleLabel}</span>
              <span className="block text-[12px] text-muted">
                {u.name}
                {r === 'vendedor' ? ' · experiencia mobile' : ''}
              </span>
            </span>
            {r === role && <Check size={16} className="text-accent" />}
          </button>
        )
      })}
    </div>
  )
}

function useTitle(role: Role) {
  const { pathname } = useLocation()
  const items = [...NAV[role]].sort((a, b) => b.to.length - a.to.length)
  return items.find((i) => pathname === i.to || pathname.startsWith(i.to + '/'))?.label ?? ''
}

export function AppShell({ role }: { role: 'gerencia' | 'admin' }) {
  const [palette, setPalette] = useState(false)
  const [more, setMore] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const user = USERS[role]
  const title = useTitle(role)
  const { pathname } = useLocation()
  const badges = useBadges()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 })
  }, [pathname])

  const tabs = MOBILE_TABS[role].map((to) => NAV[role].find((n) => n.to === to)!)

  return (
    <div className="flex h-full">
      {/* Sidebar desktop */}
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-line bg-bg px-3 pt-4 pb-3 lg:flex">
        <div className="flex h-9 items-center px-2">
          <Logo />
        </div>
        <button
          onClick={() => setPalette(true)}
          className="mt-4 mb-4 flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-[13px] text-muted hover:border-line-strong"
        >
          <Search size={15} />
          <span className="flex-1 text-left">Buscar</span>
          <kbd className="font-mono text-[11px]">⌘K</kbd>
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <NavList role={role} />
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <button onClick={() => setRoleOpen(true)} className="flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-3">
            <span className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-bg">{user.initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium">{user.name}</span>
              <span className="block truncate text-[12px] text-muted">{user.roleLabel} · cambiar vista</span>
            </span>
            <ChevronsUpDown size={15} className="text-muted" />
          </button>
          <ThemeSwitch className="self-start" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior */}
        <header className="pt-safe sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            <button className="lg:hidden" onClick={() => setMore(true)} aria-label="Menú">
              <Menu size={20} className="text-ink-2" />
            </button>
            <span className="lg:hidden">
              <Logo compact />
            </span>
            <h1 className="truncate text-[15px] font-semibold md:text-[16px]">{title}</h1>
            <div className="flex-1" />
            <DataFreshness role={role} />
            <button
              onClick={() => setPalette(true)}
              className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-surface-3 lg:hidden"
              aria-label="Buscar"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => setRoleOpen(true)}
              className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-bg lg:hidden"
              aria-label="Cambiar vista"
            >
              {user.initials}
            </button>
          </div>
        </header>

        <main id="main-scroll" className="min-h-0 flex-1 overflow-y-auto">
          {/* Solo animación de entrada: una salida animada duplicaría la pantalla nueva durante la transición */}
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

        {/* Pestañas inferiores mobile */}
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[color-mix(in_oklab,var(--surface)_92%,transparent)] backdrop-blur-md lg:hidden">
          <div className="grid h-16 grid-cols-5">
            {tabs.map((t) => (
              <TabLink key={t.to} item={t} count={t.badge ? badges[t.badge] : 0} />
            ))}
            <button onClick={() => setMore(true)} className="flex flex-col items-center justify-center gap-1 text-[10.5px] text-muted">
              <Menu size={21} strokeWidth={1.8} />
              Más
            </button>
          </div>
        </nav>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} role={role} />

      <Sheet open={more} onClose={() => setMore(false)} title="Menú" eyebrow={`${user.name} · ${user.roleLabel}`}>
        <div className="flex flex-col gap-4 p-4">
          <NavList role={role} onNavigate={() => setMore(false)} />
          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="text-[13px] text-muted">Tema</span>
            <ThemeSwitch />
          </div>
        </div>
      </Sheet>

      <Sheet open={roleOpen} onClose={() => setRoleOpen(false)} title="Ver el prototipo como" width={420}>
        <div className="p-3">
          <RoleSwitcher role={role} onDone={() => setRoleOpen(false)} />
          <p className="px-3 pt-3 pb-1 text-[12px] text-muted">
            Cada rol ve una experiencia distinta sobre los mismos datos. En producción, cada persona entra con su propio usuario.
          </p>
        </div>
      </Sheet>

      <Toaster />
    </div>
  )
}

function TabLink({ item, count }: { item: NavItem; count: number }): ReactNode {
  const isRoot = Object.values(BASE).includes(item.to)
  const short: Record<string, string> = { 'Preguntale a Sauver': 'Preguntar' }
  return (
    <NavLink
      to={item.to}
      end={isRoot}
      className={({ isActive }) =>
        cn('relative flex flex-col items-center justify-center gap-1 text-[10.5px]', isActive ? 'font-medium text-ink' : 'text-muted')
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <item.icon size={21} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent' : ''} />
            {count > 0 && (
              <span className="num absolute -top-1.5 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent">
                {count}
              </span>
            )}
          </span>
          {short[item.label] ?? item.label}
        </>
      )}
    </NavLink>
  )
}
