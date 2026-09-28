import {
  BarChart3,
  Boxes,
  CalendarCheck,
  Database,
  Factory,
  HandCoins,
  Home,
  KanbanSquare,
  Landmark,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  Scale,
  Settings,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/data/people'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Módulo que se construye en una fase posterior (se muestra como vista previa vacía) */
  phase?: string
  badge?: 'decisiones' | 'pedidos' | 'tareas'
  group?: string
}

export const BASE: Record<Role, string> = { gerencia: '/g', admin: '/a', vendedor: '/v' }

export const NAV: Record<Role, NavItem[]> = {
  gerencia: [
    { to: '/g', label: 'Inicio', icon: LayoutDashboard },
    { to: '/g/decisiones', label: 'Decisiones', icon: Scale, badge: 'decisiones' },
    { to: '/g/preguntar', label: 'Preguntale a Sauver', icon: Sparkles },
    { to: '/g/finanzas', label: 'Finanzas', icon: Landmark, phase: 'Fase 4', group: 'Gestión' },
    { to: '/g/pedidos', label: 'Pedidos', icon: KanbanSquare, group: 'Gestión' },
    { to: '/g/clientes', label: 'Clientes', icon: Users, group: 'Gestión' },
    { to: '/g/stock', label: 'Productos y stock', icon: Boxes, phase: 'Fase 5', group: 'Gestión' },
    { to: '/g/produccion', label: 'Producción', icon: Factory, phase: 'Fase 6', group: 'Gestión' },
    { to: '/g/analisis', label: 'Análisis', icon: BarChart3, phase: 'Fase 7', group: 'Gestión' },
    { to: '/g/marketing', label: 'Marketing', icon: Megaphone, phase: 'Fase 7', group: 'Gestión' },
    { to: '/g/simulador', label: 'Simulador', icon: SlidersHorizontal, phase: 'Fase 4', group: 'Gestión' },
    { to: '/g/datos', label: 'Datos Dux', icon: Database, group: 'Sistema' },
    { to: '/g/config', label: 'Configuración', icon: Settings, phase: 'Fase 2', group: 'Sistema' },
  ],
  admin: [
    { to: '/a', label: 'Hoy', icon: CalendarCheck, badge: 'tareas' },
    { to: '/a/pedidos', label: 'Pedidos', icon: KanbanSquare, badge: 'pedidos' },
    { to: '/a/clientes', label: 'Clientes', icon: Users },
    { to: '/a/preguntar', label: 'Preguntale a Sauver', icon: Sparkles },
    { to: '/a/cobranzas', label: 'Cobranzas', icon: HandCoins, phase: 'Fase 4', group: 'Operación' },
    { to: '/a/pagos', label: 'Pagos', icon: Wallet, phase: 'Fase 4', group: 'Operación' },
    { to: '/a/stock', label: 'Stock y controles', icon: Boxes, phase: 'Fase 5', group: 'Operación' },
    { to: '/a/cierres', label: 'Cierres', icon: ReceiptText, phase: 'Fase 5', group: 'Operación' },
    { to: '/a/datos', label: 'Datos Dux', icon: Database, group: 'Sistema' },
  ],
  vendedor: [
    { to: '/v', label: 'Hoy', icon: Home },
    { to: '/v/clientes', label: 'Clientes', icon: Users },
    { to: '/v/pedidos', label: 'Pedidos', icon: KanbanSquare },
    { to: '/v/yo', label: 'Yo', icon: User },
  ],
}

/** Pestañas inferiores en mobile (Gerencia y Administración) */
export const MOBILE_TABS: Record<'gerencia' | 'admin', string[]> = {
  gerencia: ['/g', '/g/decisiones', '/g/preguntar', '/g/clientes'],
  admin: ['/a', '/a/pedidos', '/a/clientes', '/a/preguntar'],
}
