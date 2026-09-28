// DATOS FICTICIOS — cartera de clientes de ejemplo (nombres inventados, salvo "Candy Club"
// que aparece como ejemplo en la especificación).

import { TODAY, addDays } from '@/lib/dates'

export type Channel = 'Distribuidor' | 'Kiosco' | 'Tabaquería' | 'Growshop'
export type LifecycleState = 'Prospecto' | 'Nuevo' | 'Activo' | 'En riesgo' | 'Inactivo'

export interface Customer {
  id: string
  name: string
  legalName?: string
  cuit?: string
  channel: Channel
  zone: string
  address: string
  contact: string
  whatsapp: string
  state: LifecycleState
  owner: 'Tomás' | 'Joni'
  priceList: string
  paymentTerm: string
  creditLimit?: number
  /** Días entre compras (mediana histórica). null si no hay historia suficiente */
  frequencyDays: number | null
  lastPurchaseDaysAgo: number | null
  firstPurchase?: string
  /** Compra mensual promedio (6 meses, $) */
  monthlyAvg: number
  ticketAvg: number
  /** Unidades Sauver últimos 12 meses */
  units12m: number
  balance: number
  overdue: number
  /** Días reales de pago (promedio) */
  realPaymentDays: number | null
  nextCollection?: { date: Date; amount: number }
  /** Tendencia de compras 6 meses: + crece, − cae (en %) */
  trend: number
  /** Unidades por mes (12 meses, oct → sep) */
  history: number[]
  topProducts: { productId: string; share: number }[]
  neverBought?: string[]
  duxLinks: { source: string; code: string }[]
  photoTone: string
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'c-norte', name: 'Distribuidora Norte', legalName: 'Norte Distribuciones S.R.L.', cuit: '30-71234567-9',
    channel: 'Distribuidor', zone: 'La Plata', address: 'Av. 44 N° 1820, La Plata', contact: 'Martín Ibarra',
    whatsapp: '+54 9 221 555-0141', state: 'Activo', owner: 'Joni', priceList: 'Distribuidor A',
    paymentTerm: '30 días', creditLimit: 6_000_000, frequencyDays: 14, lastPurchaseDaysAgo: 9, firstPurchase: 'mar 2024',
    monthlyAvg: 4_150_000, ticketAvg: 1_940_000, units12m: 101_400, balance: 3_420_000, overdue: 0, realPaymentDays: 33,
    nextCollection: { date: addDays(TODAY, 3), amount: 1_380_000 }, trend: 6,
    history: [7800, 8100, 9900, 6900, 7200, 8200, 8400, 8600, 9100, 8800, 9200, 9200],
    topProducts: [{ productId: 'sv-reg', share: 52 }, { productId: 'sv-ks', share: 31 }, { productId: 'sv-slim', share: 17 }],
    duxLinks: [{ source: 'Dux Sauver', code: 'CL-0012' }, { source: 'Dux Joni', code: 'J-0344' }], photoTone: '#35584b',
  },
  {
    id: 'c-sur', name: 'Distribuidora del Sur', legalName: 'Del Sur Mayorista S.A.', cuit: '30-70998812-4',
    channel: 'Distribuidor', zone: 'Quilmes', address: 'Mitre 455, Quilmes', contact: 'Gabriela Ponce',
    whatsapp: '+54 9 11 5555-0192', state: 'En riesgo', owner: 'Joni', priceList: 'Distribuidor A',
    paymentTerm: '30 días', creditLimit: 4_000_000, frequencyDays: 21, lastPurchaseDaysAgo: 34, firstPurchase: 'ago 2024',
    monthlyAvg: 2_380_000, ticketAvg: 1_620_000, units12m: 58_900, balance: 1_610_000, overdue: 420_000, realPaymentDays: 41,
    nextCollection: { date: addDays(TODAY, 6), amount: 820_000 }, trend: -22,
    history: [5600, 5900, 6800, 5200, 5400, 5600, 5100, 4700, 4400, 4100, 3600, 2500],
    topProducts: [{ productId: 'sv-reg', share: 64 }, { productId: 'sv-ks', share: 36 }],
    neverBought: ['sv-slim'], duxLinks: [{ source: 'Dux Sauver', code: 'CL-0019' }], photoTone: '#4a5a52',
  },
  {
    id: 'c-oeste', name: 'Mayorista Oeste', legalName: 'Oeste Golosinas S.R.L.', cuit: '30-71555001-2',
    channel: 'Distribuidor', zone: 'Avellaneda', address: 'Av. Mitre 3200, Avellaneda', contact: 'Rubén Sosa',
    whatsapp: '+54 9 11 5555-0177', state: 'Activo', owner: 'Joni', priceList: 'Distribuidor B',
    paymentTerm: '15 días', creditLimit: 3_000_000, frequencyDays: 18, lastPurchaseDaysAgo: 12, firstPurchase: 'nov 2024',
    monthlyAvg: 1_720_000, ticketAvg: 1_050_000, units12m: 41_200, balance: 980_000, overdue: 0, realPaymentDays: 17,
    nextCollection: { date: addDays(TODAY, 2), amount: 610_000 }, trend: 11,
    history: [2900, 3000, 3900, 2800, 3100, 3300, 3400, 3500, 3700, 3800, 3900, 3900],
    topProducts: [{ productId: 'sv-reg', share: 48 }, { productId: 'sv-mini', share: 27 }, { productId: 'sv-ks', share: 25 }],
    duxLinks: [{ source: 'Dux Sauver', code: 'CL-0027' }], photoTone: '#3d4f47',
  },
  {
    id: 'c-candy', name: 'Candy Club', legalName: 'Candy Club de R. Méndez', cuit: '20-28876543-1',
    channel: 'Kiosco', zone: 'La Plata', address: 'Calle 7 N° 902, La Plata', contact: 'Rocío Méndez',
    whatsapp: '+54 9 221 555-0110', state: 'Activo', owner: 'Tomás', priceList: 'Kiosco',
    paymentTerm: 'Contado', frequencyDays: 24, lastPurchaseDaysAgo: 22, firstPurchase: 'may 2025',
    monthlyAvg: 196_000, ticketAvg: 155_000, units12m: 4_150, balance: 0, overdue: 0, realPaymentDays: 0,
    trend: 9, history: [260, 280, 390, 240, 250, 300, 320, 330, 380, 400, 480, 520],
    topProducts: [{ productId: 'sv-reg', share: 70 }, { productId: 'sv-ks', share: 30 }],
    neverBought: ['sv-slim'], duxLinks: [{ source: 'Dux Sauver', code: 'CL-0102' }, { source: 'Dux Joni', code: 'J-0412' }],
    photoTone: '#6a4a5e',
  },
  {
    id: 'c-faro', name: 'Kiosco El Faro', channel: 'Kiosco', zone: 'Berisso', address: 'Av. Montevideo 1450, Berisso',
    contact: 'Hugo Gatti', whatsapp: '+54 9 221 555-0133', state: 'En riesgo', owner: 'Tomás', priceList: 'Kiosco',
    paymentTerm: '7 días', frequencyDays: 20, lastPurchaseDaysAgo: 27, firstPurchase: 'jun 2025', legalName: 'Hugo Gatti',
    cuit: '20-17654321-0', monthlyAvg: 142_000, ticketAvg: 98_000, units12m: 2_900, balance: 186_000, overdue: 186_000,
    realPaymentDays: 16, nextCollection: { date: addDays(TODAY, 1), amount: 186_000 }, trend: -8,
    history: [210, 230, 300, 200, 220, 250, 260, 250, 240, 230, 260, 250],
    topProducts: [{ productId: 'sv-reg', share: 100 }], neverBought: ['sv-ks'], duxLinks: [{ source: 'Dux Sauver', code: 'CL-0118' }],
    photoTone: '#3e5a6e',
  },
  {
    id: 'c-rivas', name: 'Tabaquería Rivas', legalName: 'Rivas e Hijos S.H.', cuit: '30-68123456-7', channel: 'Tabaquería',
    zone: 'San Telmo', address: 'Defensa 1022, CABA', contact: 'Ana Rivas', whatsapp: '+54 9 11 5555-0120',
    state: 'Activo', owner: 'Tomás', priceList: 'Tabaquería', paymentTerm: '15 días', creditLimit: 900_000,
    frequencyDays: 16, lastPurchaseDaysAgo: 18, firstPurchase: 'ene 2025', monthlyAvg: 420_000, ticketAvg: 230_000,
    units12m: 8_700, balance: 480_000, overdue: 480_000, realPaymentDays: 29,
    nextCollection: { date: addDays(TODAY, -4), amount: 480_000 }, trend: 3,
    history: [640, 660, 820, 610, 630, 700, 720, 730, 760, 770, 800, 860],
    topProducts: [{ productId: 'sv-ks', share: 46 }, { productId: 'sv-slim', share: 34 }, { productId: 'sv-reg', share: 20 }],
    duxLinks: [{ source: 'Dux Sauver', code: 'CL-0087' }, { source: 'Dux Joni', code: 'J-0301' }], photoTone: '#5e4632',
  },
  {
    id: 'c-humo', name: 'Humo & Co.', channel: 'Tabaquería', zone: 'Palermo', address: 'Honduras 4800, CABA',
    contact: 'Federico Luna', whatsapp: '+54 9 11 5555-0165', state: 'Nuevo', owner: 'Tomás', priceList: 'Tabaquería',
    paymentTerm: 'Contado', frequencyDays: null, lastPurchaseDaysAgo: 11, firstPurchase: 'sep 2026', legalName: 'Luna Federico',
    cuit: '20-33445566-8', monthlyAvg: 185_000, ticketAvg: 185_000, units12m: 400, balance: 0, overdue: 0,
    realPaymentDays: 0, trend: 0, history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 400],
    topProducts: [{ productId: 'sv-ks', share: 60 }, { productId: 'sv-slim', share: 40 }],
    duxLinks: [{ source: 'Dux Sauver', code: 'CL-0141' }], photoTone: '#2f3e4c',
  },
  {
    id: 'c-pulperia', name: 'La Pulpería', channel: 'Kiosco', zone: 'City Bell', address: 'Cantilo 520, City Bell',
    contact: 'Sofía Ruiz', whatsapp: '+54 9 221 555-0158', state: 'Activo', owner: 'Tomás', priceList: 'Kiosco',
    paymentTerm: 'Contado', frequencyDays: 21, lastPurchaseDaysAgo: 19, firstPurchase: 'feb 2025', legalName: 'Ruiz Sofía',
    cuit: '27-30111222-5', monthlyAvg: 118_000, ticketAvg: 96_000, units12m: 2_450, balance: 0, overdue: 0,
    realPaymentDays: 0, trend: 4, history: [160, 180, 240, 150, 170, 200, 210, 200, 220, 230, 230, 250],
    topProducts: [{ productId: 'sv-reg', share: 80 }, { productId: 'sv-mini', share: 20 }],
    neverBought: ['sv-ks'], duxLinks: [{ source: 'Dux Sauver', code: 'CL-0109' }], photoTone: '#5b5a3c',
  },
  {
    id: 'c-24', name: 'Kiosco 24 Horas', channel: 'Kiosco', zone: 'La Plata', address: 'Diag. 74 N° 1330, La Plata',
    contact: 'Diego Paz', whatsapp: '+54 9 221 555-0171', state: 'Activo', owner: 'Tomás', priceList: 'Kiosco',
    paymentTerm: '7 días', frequencyDays: 12, lastPurchaseDaysAgo: 5, firstPurchase: 'oct 2024', legalName: 'Paz Diego',
    cuit: '20-29888777-3', monthlyAvg: 264_000, ticketAvg: 112_000, units12m: 6_100, balance: 112_000, overdue: 0,
    realPaymentDays: 8, nextCollection: { date: addDays(TODAY, 2), amount: 112_000 }, trend: 14,
    history: [380, 400, 560, 360, 380, 450, 470, 500, 540, 590, 690, 780],
    topProducts: [{ productId: 'sv-reg', share: 58 }, { productId: 'sv-ks', share: 42 }],
    duxLinks: [{ source: 'Dux Sauver', code: 'CL-0095' }], photoTone: '#3c4a61',
  },
  {
    id: 'c-verde', name: 'Growshop Raíz Verde', channel: 'Growshop', zone: 'La Plata', address: 'Calle 12 N° 1560, La Plata',
    contact: 'Lautaro Díaz', whatsapp: '+54 9 221 555-0187', state: 'Activo', owner: 'Tomás', priceList: 'Kiosco',
    paymentTerm: '15 días', frequencyDays: 30, lastPurchaseDaysAgo: 26, firstPurchase: 'dic 2024', legalName: 'Raíz Verde S.A.S.',
    cuit: '30-71888999-6', monthlyAvg: 210_000, ticketAvg: 205_000, units12m: 3_200, balance: 205_000, overdue: 0,
    realPaymentDays: 14, nextCollection: { date: addDays(TODAY, 4), amount: 205_000 }, trend: 2,
    history: [220, 240, 300, 230, 240, 260, 270, 280, 270, 290, 300, 300],
    topProducts: [{ productId: 'sv-slim', share: 55 }, { productId: 'sv-ks', share: 45 }],
    duxLinks: [{ source: 'Dux Sauver', code: 'CL-0121' }, { source: 'Dux Joni', code: 'J-0388' }], photoTone: '#3b5b3f',
  },
  {
    id: 'c-plaza', name: 'Maxikiosco Plaza', channel: 'Kiosco', zone: 'San Telmo', address: 'Bolívar 980, CABA',
    contact: 'Valeria Soto', whatsapp: '+54 9 11 5555-0104', state: 'Inactivo', owner: 'Tomás', priceList: 'Kiosco',
    paymentTerm: 'Contado', frequencyDays: 25, lastPurchaseDaysAgo: 96, firstPurchase: 'abr 2025', legalName: 'Soto Valeria',
    cuit: '27-31222333-1', monthlyAvg: 0, ticketAvg: 88_000, units12m: 900, balance: 0, overdue: 0, realPaymentDays: 0,
    trend: -100, history: [180, 170, 210, 150, 120, 70, 0, 0, 0, 0, 0, 0],
    topProducts: [{ productId: 'sv-reg', share: 100 }], duxLinks: [{ source: 'Dux Sauver', code: 'CL-0114' }],
    photoTone: '#584040',
  },
  {
    id: 'c-estacion', name: 'Kiosco La Estación', channel: 'Kiosco', zone: 'Tolosa', address: 'Calle 1 N° 520, Tolosa',
    contact: 'Pablo Ferreyra', whatsapp: '+54 9 221 555-0199', state: 'Prospecto', owner: 'Tomás', priceList: 'Kiosco',
    paymentTerm: 'Contado', frequencyDays: null, lastPurchaseDaysAgo: null, monthlyAvg: 0, ticketAvg: 0, units12m: 0,
    balance: 0, overdue: 0, realPaymentDays: null, trend: 0, history: Array(12).fill(0), topProducts: [],
    duxLinks: [], photoTone: '#4a4f5c',
  },
  {
    id: 'c-bohemia', name: 'Bohemia Tabacos', channel: 'Tabaquería', zone: 'San Telmo', address: 'Chile 640, CABA',
    contact: 'Mariano Vidal', whatsapp: '+54 9 11 5555-0148', state: 'Prospecto', owner: 'Tomás', priceList: 'Tabaquería',
    paymentTerm: 'Contado', frequencyDays: null, lastPurchaseDaysAgo: null, monthlyAvg: 0, ticketAvg: 0, units12m: 0,
    balance: 0, overdue: 0, realPaymentDays: null, trend: 0, history: Array(12).fill(0), topProducts: [],
    duxLinks: [], photoTone: '#5a4a3a',
  },
  {
    id: 'c-lumen', name: 'Distribuidora Lumen', legalName: 'Lumen Distribuidora S.A.', cuit: '30-71000222-8',
    channel: 'Distribuidor', zone: 'Berazategui', address: 'Calle 14 N° 4400, Berazategui', contact: 'Silvina Ortiz',
    whatsapp: '+54 9 11 5555-0136', state: 'Activo', owner: 'Joni', priceList: 'Distribuidor B',
    paymentTerm: '30 días', creditLimit: 2_500_000, frequencyDays: 21, lastPurchaseDaysAgo: 29, firstPurchase: 'jul 2025',
    monthlyAvg: 1_240_000, ticketAvg: 860_000, units12m: 26_800, balance: 860_000, overdue: 0, realPaymentDays: 31,
    nextCollection: { date: addDays(TODAY, 9), amount: 860_000 }, trend: -12,
    history: [1800, 2000, 2700, 2100, 2300, 2500, 2400, 2300, 2200, 2100, 2000, 1900],
    topProducts: [{ productId: 'sv-reg', share: 71 }, { productId: 'sv-ks', share: 29 }],
    duxLinks: [{ source: 'Dux Sauver', code: 'CL-0133' }], photoTone: '#394a5a',
  },
]

export function customer(id: string): Customer {
  const c = CUSTOMERS.find((x) => x.id === id)
  if (!c) throw new Error(`Cliente desconocido: ${id}`)
  return c
}

/** Días de atraso sobre la frecuencia habitual (positivo = demorado) */
export function repurchaseDelay(c: Customer): number | null {
  if (c.frequencyDays == null || c.lastPurchaseDaysAgo == null) return null
  return c.lastPurchaseDaysAgo - c.frequencyDays
}

export type TimelineKind = 'foto' | 'visita' | 'pedido' | 'entrega' | 'cobro' | 'nota' | 'seguimiento'

export interface TimelineEvent {
  id: string
  date: Date
  kind: TimelineKind
  title: string
  detail?: string
  amount?: number
  by?: string
  photoTone?: string
}

/** Historial de ejemplo; se genera igual para cualquier cliente con compras. */
export function timelineFor(c: Customer): TimelineEvent[] {
  if (c.state === 'Prospecto') {
    return [
      { id: 't1', date: addDays(TODAY, -6), kind: 'foto', title: 'Foto del comercio', by: 'Tomás', photoTone: c.photoTone },
      {
        id: 't2', date: addDays(TODAY, -6), kind: 'visita', title: 'Visita · Interesado',
        detail: 'Quiere probar Regular. Objeción: tiene stock de otra marca.', by: 'Tomás',
      },
      { id: 't3', date: addDays(TODAY, 2), kind: 'seguimiento', title: 'Volver a visitar', detail: 'Llevar muestra de Regular', by: 'Tomás' },
    ]
  }
  const last = c.lastPurchaseDaysAgo ?? 30
  const f = c.frequencyDays ?? 21
  const t = c.ticketAvg || 100_000
  const events: TimelineEvent[] = [
    ...(c.nextCollection
      ? [{
          id: 'n1', date: c.nextCollection.date, kind: 'cobro' as const, title: 'Cobro esperado',
          detail: 'Fecha comprometida por WhatsApp', amount: c.nextCollection.amount, by: 'Carla',
        }]
      : []),
    { id: 'e1', date: addDays(TODAY, -last), kind: 'foto', title: 'Foto de la visita', by: 'Tomás', photoTone: c.photoTone },
    { id: 'e2', date: addDays(TODAY, -last), kind: 'visita', title: 'Visita · Compró', detail: 'Repuso Regular y sumó Kingsize.', by: 'Tomás' },
    { id: 'e3', date: addDays(TODAY, -last), kind: 'pedido', title: 'Pedido P-10' + (21 + (c.id.length % 9)), amount: t, by: 'Tomás' },
    { id: 'e4', date: addDays(TODAY, -last + 2), kind: 'entrega', title: 'Entregado', detail: 'Factura B 0003-00018' + (40 + c.id.length), by: 'Ramón' },
    { id: 'e5', date: addDays(TODAY, -last + 9), kind: 'cobro', title: 'Cobrado', amount: t, detail: 'Transferencia', by: 'Carla' },
    { id: 'e6', date: addDays(TODAY, -last - 4), kind: 'nota', title: 'Nota', detail: 'Prefiere entregas martes o jueves a la mañana.', by: 'Carla' },
    { id: 'e7', date: addDays(TODAY, -last - f), kind: 'foto', title: 'Foto de la visita', by: 'Tomás', photoTone: c.photoTone },
    { id: 'e8', date: addDays(TODAY, -last - f), kind: 'pedido', title: 'Pedido P-09' + (60 + (c.id.length % 30)), amount: Math.round(t * 0.92), by: 'Tomás' },
    { id: 'e9', date: addDays(TODAY, -last - f + 8), kind: 'cobro', title: 'Cobrado', amount: Math.round(t * 0.92), detail: 'Efectivo', by: 'Joni' },
  ]
  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}
