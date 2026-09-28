// DATOS FICTICIOS — tareas y controles de Administración.

import { TODAY, addDays } from '@/lib/dates'

export type TaskBucket = 'vencida' | 'hoy' | 'semana' | 'mes'
export type TaskOrigin = 'Diaria' | 'Semanal' | 'Días 1–5' | '1ª semana' | 'Última semana' | 'Mensual' | 'Cierre' | 'Alerta'

export interface Task {
  id: string
  title: string
  detail?: string
  due: Date
  origin: TaskOrigin
  area: string
  /** Pantalla donde se resuelve (atajo) */
  shortcut?: string
  done?: boolean
  snoozed?: boolean
  escalated?: boolean
  note?: string
}

export const TASKS: Task[] = [
  {
    id: 't1', title: 'Actualizar compromiso de cobro — Kiosco El Faro', detail: 'Vencido hace 3 días · $ 186.000',
    due: addDays(TODAY, -2), origin: 'Alerta', area: 'Cobranzas',
  },
  {
    id: 't2', title: 'Importar compras de septiembre (Dux Sauver)', detail: 'Sin este reporte el margen del mes queda provisional',
    due: addDays(TODAY, -1), origin: 'Semanal', area: 'Datos Dux', shortcut: 'datos',
  },
  {
    id: 't3', title: 'Coordinar con Ramón el conteo de fin de mes', detail: 'La Plata y San Telmo',
    due: TODAY, origin: 'Última semana', area: 'Stock',
  },
  {
    id: 't4', title: 'Importar ventas y cobranzas de la semana', detail: 'Dux Sauver y Dux Joni',
    due: TODAY, origin: 'Semanal', area: 'Datos Dux', shortcut: 'datos',
  },
  {
    id: 't5', title: 'Vincular factura del pedido P-1038', detail: 'Growshop Raíz Verde · entregado el 23/09',
    due: TODAY, origin: 'Alerta', area: 'Pedidos', shortcut: 'pedidos',
  },
  {
    id: 't6', title: 'Revisar lista de precios de octubre', detail: 'Proveedor de plástico anunció +9 %',
    due: TODAY, origin: 'Mensual', area: 'Precios',
  },
  {
    id: 't7', title: 'Cierre de septiembre: checklist', detail: '6 de 9 ítems completos',
    due: addDays(TODAY, 2), origin: 'Cierre', area: 'Cierre',
  },
  {
    id: 't8', title: 'Obligaciones fijas: sueldos, alquiler, contador', detail: 'Programadas del 1 al 5',
    due: addDays(TODAY, 3), origin: 'Días 1–5', area: 'Pagos',
  },
  {
    id: 't9', title: 'Informar a Ramón producción del lote 27', detail: 'Retiro estimado 13/10 en Inyectora Ensenada',
    due: addDays(TODAY, 4), origin: 'Días 1–5', area: 'Producción',
  },
  {
    id: 't10', title: 'Control físico de stock (1ª semana)', detail: 'Ramón informa por WhatsApp · cargar diferencias',
    due: addDays(TODAY, 6), origin: '1ª semana', area: 'Stock',
  },
  {
    id: 't11', title: 'Mantenimiento de datos: clientes sin canal', detail: '4 clientes en Dux Sauver',
    due: addDays(TODAY, 12), origin: 'Mensual', area: 'Calidad Dux',
  },
  {
    id: 't12', title: 'Documentación fiscal para el contador', detail: 'Enviar antes del día 15',
    due: addDays(TODAY, 15), origin: 'Mensual', area: 'Fiscal',
  },
]

export function bucketOf(t: Task): TaskBucket {
  const diff = Math.round((t.due.getTime() - TODAY.getTime()) / 86_400_000)
  if (diff < 0) return 'vencida'
  if (diff === 0) return 'hoy'
  if (diff <= 7) return 'semana'
  return 'mes'
}

// Control diario (sin doble carga): Administración confirma que el circuito
// WhatsApp → Dux se completó. SAUVER recibe los movimientos por importación.
export interface ChecklistItem {
  id: string
  label: string
  hint: string
}

export const DAILY_CHECKLIST: ChecklistItem[] = [
  { id: 'wa', label: 'WhatsApp revisado', hint: 'Grupo operativo leído hasta el último mensaje' },
  { id: 'cobros', label: 'Cobros cargados en Dux', hint: 'Todos los cobros informados' },
  { id: 'pagos', label: 'Pagos cargados en Dux', hint: 'Transferencias y efectivo' },
  { id: 'gastos', label: 'Gastos cargados en Dux', hint: 'Con comprobante o categoría' },
  { id: 'compras', label: 'Compras cargadas en Dux', hint: 'Plástico, packing, insumos' },
  { id: 'conciliado', label: 'Día conciliado', hint: 'Saldos de Dux coinciden con bancos' },
]

export const CHECKLIST_INITIAL: Record<string, boolean> = {
  wa: true,
  cobros: true,
  pagos: false,
  gastos: false,
  compras: false,
  conciliado: false,
}

/** Últimos días hábiles: si se completó el control */
export const CHECKLIST_HISTORY = [
  { date: addDays(TODAY, -7), done: 6 },
  { date: addDays(TODAY, -6), done: 6 },
  { date: addDays(TODAY, -5), done: 6 },
  { date: addDays(TODAY, -4), done: 5 },
  { date: addDays(TODAY, -3), done: 6 },
]

export const CLOSING = {
  period: 'Septiembre',
  items: [
    { label: 'Movimientos del mes en Dux', done: true },
    { label: 'Conciliación bancaria', done: true },
    { label: 'Cobranzas revisadas', done: true },
    { label: 'Pagos revisados', done: true },
    { label: 'Facturación y documentación', done: true },
    { label: 'Reportes Dux completos', done: false, note: 'Falta compras' },
    { label: 'Costos actualizados', done: false, note: '18 % sin validar' },
    { label: 'Control físico de stock', done: false, note: 'Fin de mes pendiente' },
    { label: 'Fiscal', done: true },
  ],
}

export const DUX_QUALITY = {
  score: 87,
  issues: [
    { label: 'Clientes sin canal', count: 4 },
    { label: 'Productos con costo desactualizado', count: 3 },
    { label: 'Clientes sin condición de pago', count: 6 },
    { label: 'Posibles duplicados', count: 2 },
  ],
}
