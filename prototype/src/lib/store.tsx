// Estado en memoria del prototipo. Permite ver el circuito completo sin backend:
// un pedido que el vendedor envía aparece al instante en el tablero de Administración.

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { ORDERS, type Order, type OrderStatus, STATUS_LABEL } from '@/data/orders'
import { TASKS, CHECKLIST_INITIAL, type Task } from '@/data/admin'
import { DECISIONS, type Decision } from '@/data/finance'

interface State {
  orders: Order[]
  tasks: Task[]
  checklist: Record<string, boolean>
  decisions: Decision[]
  visitsToday: number
  nextOrderNumber: number
}

type Action =
  | { type: 'order/add'; order: Order }
  | { type: 'order/advance'; id: string; to: OrderStatus; by: string; duxRef?: string }
  | { type: 'order/cancel'; id: string; by: string }
  | { type: 'task/toggle'; id: string }
  | { type: 'task/snooze'; id: string }
  | { type: 'task/escalate'; id: string }
  | { type: 'task/note'; id: string; note: string }
  | { type: 'checklist/toggle'; id: string }
  | { type: 'decision/decide'; id: string }
  | { type: 'visit/add' }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'order/add':
      return { ...s, orders: [a.order, ...s.orders], nextOrderNumber: s.nextOrderNumber + 1 }
    case 'order/advance':
      return {
        ...s,
        orders: s.orders.map((o) =>
          o.id !== a.id
            ? o
            : {
                ...o,
                status: a.to,
                isNew: false,
                duxRefs: a.duxRef ? { ...o.duxRefs, sauver: a.duxRef } : o.duxRefs,
                events: [...o.events, { at: new Date(), label: `Pasó a ${STATUS_LABEL[a.to]}`, by: a.by }],
              },
        ),
      }
    case 'order/cancel':
      return {
        ...s,
        orders: s.orders.map((o) =>
          o.id !== a.id ? o : { ...o, status: 'cancelado', events: [...o.events, { at: new Date(), label: 'Cancelado', by: a.by }] },
        ),
      }
    case 'task/toggle':
      return { ...s, tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t)) }
    case 'task/snooze':
      return {
        ...s,
        tasks: s.tasks.map((t) => {
          if (t.id !== a.id) return t
          const due = new Date(t.due)
          due.setDate(due.getDate() + 1)
          return { ...t, due, snoozed: true }
        }),
      }
    case 'task/escalate':
      return { ...s, tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, escalated: true } : t)) }
    case 'task/note':
      return { ...s, tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, note: a.note } : t)) }
    case 'checklist/toggle':
      return { ...s, checklist: { ...s.checklist, [a.id]: !s.checklist[a.id] } }
    case 'decision/decide':
      return { ...s, decisions: s.decisions.map((d) => (d.id === a.id ? { ...d, status: 'decidida' } : d)) }
    case 'visit/add':
      return { ...s, visitsToday: s.visitsToday + 1 }
  }
}

export interface Toast {
  id: number
  title: string
  body?: string
  tone?: 'good' | 'info'
  action?: { label: string; onClick: () => void }
}

interface Ctx {
  state: State
  dispatch: (a: Action) => void
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    orders: ORDERS,
    tasks: TASKS,
    checklist: CHECKLIST_INITIAL,
    decisions: DECISIONS,
    visitsToday: 0,
    nextOrderNumber: 1047,
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])
  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq.current
      setToasts((ts) => [...ts.slice(-2), { ...t, id }])
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ state, dispatch, toasts, toast, dismissToast }), [state, toasts, toast, dismissToast])
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp fuera de AppProvider')
  return c
}
