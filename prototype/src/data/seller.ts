// DATOS FICTICIOS — la semana del vendedor.

import { TODAY, addDays } from '@/lib/dates'

export const SELLER_GOALS = {
  period: 'Últimos 7 días',
  visits: { done: 8, target: 12 },
  newCustomers: { done: 3, target: 5 },
  streetDays: { done: 2, target: 3 },
  sales: { done: 2_110_000, target: 2_700_000 },
  monthSales: { done: 8_640_000, target: 10_500_000 },
  conversion: 27,
  commission: {
    fixed: 450_000,
    variable: 186_400,
    detail: [
      { label: 'Sauver · 3 % sobre $ 5,2 M', amount: 156_000 },
      { label: 'Joni y Grower · 5 % sobre $ 608 k', amount: 30_400 },
    ],
  },
}

export type RouteReason = 'revisita' | 'recompra' | 'demorado' | 'prospecto' | 'cobro'

export interface RouteStop {
  customerId: string
  reason: RouteReason
  label: string
  when?: Date
}

export const TODAY_ROUTE: RouteStop[] = [
  { customerId: 'c-estacion', reason: 'revisita', label: 'Revisita programada · llevar muestra', when: TODAY },
  { customerId: 'c-candy', reason: 'recompra', label: 'Recompra en 2 días · suele llevar Regular x3' },
  { customerId: 'c-faro', reason: 'demorado', label: 'Recompra demorada 7 días' },
  { customerId: 'c-pulperia', reason: 'recompra', label: 'Nunca compró Kingsize · ofrecer' },
  { customerId: 'c-bohemia', reason: 'prospecto', label: 'Prospecto · pidió volver el lunes', when: TODAY },
  { customerId: 'c-verde', reason: 'recompra', label: 'Recompra en 4 días' },
]

export const OBJECTIONS = ['Precio', 'Otra marca', 'Tiene stock', 'Hablar con dueño', 'Quiere probar', 'Otro']

export const NEXT_VISIT_OPTIONS = [
  { label: 'En 3 días', days: 3 },
  { label: 'Próx. semana', days: 7 },
  { label: 'En 15 días', days: 15 },
]

export const NOT_INTERESTED_REASONS = ['Precio', 'No vende el rubro', 'Exclusividad con otra marca', 'Mal momento', 'Otro']

export const WEEK_DAYS = [
  { date: addDays(TODAY, -4), visits: 0, street: false },
  { date: addDays(TODAY, -3), visits: 5, street: true },
  { date: addDays(TODAY, -2), visits: 0, street: false },
  { date: addDays(TODAY, -1), visits: 3, street: true },
  { date: TODAY, visits: 0, street: true },
]
