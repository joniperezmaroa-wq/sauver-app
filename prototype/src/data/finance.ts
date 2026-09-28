// DATOS FICTICIOS — números de gestión de ejemplo. NO hay lógica financiera definitiva:
// las series están armadas a mano para que el prototipo muestre situaciones realistas
// (mes sobre equilibrio, valle de caja, costos provisionales, reporte faltante).

import { TODAY, addDays } from '@/lib/dates'

export interface MonthPoint {
  key: string
  month: number
  year: number
  /** Ventas netas reales Sauver ($) */
  sales: number
  /** Parte proyectada del mes en curso ($) */
  salesProj?: number
  units: number
  unitsProj?: number
  breakEven: number
  target: number
}

const m = (month: number, year: number, sales: number, units: number, breakEven: number, target: number): MonthPoint => ({
  key: `${year}-${month}`, month, year, sales, units, breakEven, target,
})

export const MONTHLY: MonthPoint[] = [
  m(9, 2025, 15_200_000, 31_200, 15_900_000, 16_000_000),
  m(10, 2025, 16_100_000, 32_800, 16_200_000, 16_500_000),
  m(11, 2025, 18_900_000, 37_500, 16_500_000, 18_000_000),
  m(0, 2026, 14_800_000, 28_900, 16_900_000, 15_500_000),
  m(1, 2026, 15_500_000, 29_800, 17_300_000, 16_000_000),
  m(2, 2026, 17_200_000, 32_400, 17_600_000, 17_500_000),
  m(3, 2026, 17_800_000, 33_000, 18_000_000, 18_000_000),
  m(4, 2026, 18_400_000, 33_600, 18_400_000, 18_500_000),
  m(5, 2026, 19_600_000, 35_100, 18_800_000, 19_000_000),
  m(6, 2026, 20_300_000, 35_800, 19_200_000, 20_000_000),
  m(7, 2026, 21_100_000, 36_400, 19_700_000, 21_000_000),
  { ...m(8, 2026, 19_400_000, 33_200, 20_100_000, 22_000_000), salesProj: 3_400_000, unitsProj: 5_400 },
]

export const CURRENT = MONTHLY[MONTHLY.length - 1]
export const PREV = MONTHLY[MONTHLY.length - 2]

export const DATA_CUTOFF = addDays(TODAY, -2) // Datos Dux al 26/09

/** % de las ventas del período con costo validado */
export const COST_CONFIDENCE = 82

export const KPI = {
  salesReal: CURRENT.sales,
  salesProj: CURRENT.sales + (CURRENT.salesProj ?? 0),
  unitsReal: CURRENT.units,
  unitsProj: CURRENT.units + (CURRENT.unitsProj ?? 0),
  breakEven: CURRENT.breakEven,
  resultProj: 1_900_000,
  resultPrev: 1_450_000,
  grossMarginPct: 41.2,
  grossMarginPrevPct: 42.6,
  contributionPct: 33.8,
  fixedCosts: 6_800_000,
  cashTotal: 9_800_000,
  cashFloor: 5_000_000,
  cashFree: 1_100_000,
  cashValley: 6_100_000,
  cashValleyDate: addDays(TODAY, 16),
  receivables: 12_600_000,
  receivables7d: 3_400_000,
  receivables30d: 9_500_000,
  overdue: 3_100_000,
  collectedMonth: 17_800_000,
  payables30d: 7_900_000,
  activeCustomers: 64,
  newCustomersMonth: 5,
  criticalStock: 1,
}

export const SAFETY_MARGIN = ((KPI.salesProj - KPI.breakEven) / KPI.salesProj) * 100

// ————— Caja: 30 días reales + 90 días proyectados —————

export interface CashPoint {
  date: Date
  label: string
  real?: number
  proj?: number
  /** Banda de escenario conservador/optimista (solo proyección) */
  low?: number
  high?: number
  floor: number
  event?: string
}

function buildCash(): CashPoint[] {
  const pts: CashPoint[] = []
  // Historia real (30 días): oscilación con cobros y pagos
  let v = 8_600_000
  for (let d = -30; d <= 0; d++) {
    const date = addDays(TODAY, d)
    const wave = Math.sin(d / 3.2) * 260_000 + Math.cos(d / 7) * 180_000
    const drift = (d + 30) * 38_000
    if (d === -26) v -= 3_900_000 // sueldos
    if (d === -24) v += 2_100_000
    if (d === -17) v += 1_600_000
    const val = Math.round(v + drift + wave)
    pts.push({ date, label: '', real: d === 0 ? KPI.cashTotal : val, floor: KPI.cashFloor })
  }
  // Proyección (90 días) — eventos conocidos
  const events: Record<number, [number, string]> = {
    2: [-1_450_000, 'Proveedor packing'],
    3: [1_380_000, 'Cobro Distribuidora Norte'],
    4: [-4_300_000, 'Sueldos y cargas'],
    6: [-620_000, 'Alquiler La Plata'],
    7: [1_200_000, 'Cobros kioscos y Mayorista Oeste'],
    9: [860_000, 'Cobro Distribuidora Lumen'],
    10: [-2_900_000, 'Plástico (1.500 kg)'],
    13: [-1_150_000, 'Inyección lote 27'],
    16: [-900_000, 'IVA septiembre'],
    19: [2_600_000, 'Cobros distribuidores'],
    25: [1_900_000, 'Cobros distribuidores'],
    35: [-4_400_000, 'Sueldos y cargas'],
    41: [-3_000_000, 'Plástico'],
    47: [-950_000, 'IVA octubre'],
    49: [2_400_000, 'Cobros distribuidores'],
    55: [1_800_000, 'Cobros distribuidores'],
    66: [-4_500_000, 'Sueldos y cargas'],
    70: [-2_100_000, 'Aguinaldo (1ª parte)'],
    78: [-980_000, 'IVA noviembre'],
    80: [2_300_000, 'Cobros distribuidores'],
    86: [1_700_000, 'Cobros distribuidores'],
  }
  let p = KPI.cashTotal
  for (let d = 1; d <= 90; d++) {
    const date = addDays(TODAY, d)
    const baseIn = (d <= 20 ? 355_000 : 205_000) + Math.sin(d / 2.3) * 25_000 // cobranza diaria esperada
    const baseOut = 95_000
    p += baseIn - baseOut
    let event: string | undefined
    if (events[d]) {
      p += events[d][0]
      event = events[d][1]
    }
    const spread = Math.min(0.12, 0.018 * Math.sqrt(d))
    pts.push({
      date,
      label: '',
      proj: Math.round(p),
      low: Math.round(p * (1 - spread)),
      high: Math.round(p * (1 + spread * 0.8)),
      floor: KPI.cashFloor,
      event,
    })
  }
  // Empalme: el primer punto proyectado arranca en el último real
  const today = pts.find((x) => x.real === KPI.cashTotal && x.date.getTime() === TODAY.getTime())
  if (today) {
    today.proj = KPI.cashTotal
    today.low = KPI.cashTotal
    today.high = KPI.cashTotal
  }
  return pts
}

export const CASH = buildCash()

export function cashValley(days: number) {
  const future = CASH.filter((p) => p.proj != null && p.date > TODAY && p.date <= addDays(TODAY, days))
  return future.reduce((min, p) => ((p.proj ?? Infinity) < (min.proj ?? Infinity) ? p : min), future[0])
}

// ————— Cuentas por cobrar / pagar —————

export const AGING = [
  { key: 'a_vencer', label: 'A vencer (+7 días)', amount: 7_200_000, tone: 'neutral' as const },
  { key: 'pronto', label: 'Vence en 7 días', amount: 2_300_000, tone: 'info' as const },
  { key: 'v15', label: 'Vencido 1–15 días', amount: 1_900_000, tone: 'warn' as const },
  { key: 'v30', label: 'Vencido 16–30 días', amount: 800_000, tone: 'serious' as const },
  { key: 'v30p', label: 'Vencido +30 días', amount: 400_000, tone: 'crit' as const },
]

export const PAYABLES = [
  { key: 'confirmado', label: 'Confirmado', amount: 3_100_000, detail: 'Facturas de proveedores con fecha' },
  { key: 'programado', label: 'Programado', amount: 2_600_000, detail: 'Sueldos, alquiler, contador' },
  { key: 'proyectado', label: 'Proyectado', amount: 2_200_000, detail: 'IVA, IIBB, logística estimada' },
]

export interface Receivable {
  id: string
  customerId: string
  doc: string
  amount: number
  due: Date
  expected: Date
  committed: boolean
  state: 'a_vencer' | 'vence_pronto' | 'vencido' | 'parcial'
  owner: string
}

export const RECEIVABLES: Receivable[] = [
  { id: 'r1', customerId: 'c-faro', doc: 'FB 0003-00018802', amount: 186_000, due: addDays(TODAY, -3), expected: addDays(TODAY, 1), committed: true, state: 'vencido', owner: 'Carla' },
  { id: 'r2', customerId: 'c-oeste', doc: 'FA 0003-00018855', amount: 610_000, due: addDays(TODAY, 2), expected: addDays(TODAY, 2), committed: false, state: 'vence_pronto', owner: 'Carla' },
  { id: 'r3', customerId: 'c-24', doc: 'FB 0003-00018861', amount: 112_000, due: addDays(TODAY, 2), expected: addDays(TODAY, 2), committed: false, state: 'vence_pronto', owner: 'Carla' },
  { id: 'r4', customerId: 'c-norte', doc: 'FA 0003-00018840', amount: 1_380_000, due: addDays(TODAY, 3), expected: addDays(TODAY, 3), committed: true, state: 'vence_pronto', owner: 'Joni' },
  { id: 'r5', customerId: 'c-verde', doc: 'FA 0003-00018847', amount: 205_000, due: addDays(TODAY, 4), expected: addDays(TODAY, 4), committed: false, state: 'vence_pronto', owner: 'Carla' },
  { id: 'r6', customerId: 'c-rivas', doc: 'FA 0003-00018790', amount: 480_000, due: addDays(TODAY, -4), expected: addDays(TODAY, 4), committed: true, state: 'vencido', owner: 'Carla' },
  { id: 'r7', customerId: 'c-sur', doc: 'FA 0003-00018801', amount: 420_000, due: addDays(TODAY, -2), expected: addDays(TODAY, 6), committed: false, state: 'parcial', owner: 'Joni' },
  { id: 'r8', customerId: 'c-lumen', doc: 'FA 0003-00018871', amount: 860_000, due: addDays(TODAY, 26), expected: addDays(TODAY, 29), committed: false, state: 'a_vencer', owner: 'Joni' },
]

export interface Payable {
  id: string
  concept: string
  supplier: string
  amount: number
  date: Date
  certainty: 'Confirmado' | 'Programado' | 'Proyectado'
  category: string
}

export const PAYABLE_LIST: Payable[] = [
  { id: 'p1', concept: 'Packing — cajas x 50', supplier: 'Cartonería Berisso', amount: 1_450_000, date: addDays(TODAY, 2), certainty: 'Confirmado', category: 'Insumos' },
  { id: 'p2', concept: 'Sueldos y cargas sociales', supplier: 'Personal', amount: 4_300_000, date: addDays(TODAY, 4), certainty: 'Programado', category: 'Estructura' },
  { id: 'p3', concept: 'Alquiler depósito La Plata', supplier: 'Inmobiliaria Centro', amount: 620_000, date: addDays(TODAY, 6), certainty: 'Programado', category: 'Estructura' },
  { id: 'p4', concept: 'Honorarios contador', supplier: 'Estudio Pereyra', amount: 380_000, date: addDays(TODAY, 8), certainty: 'Programado', category: 'Estructura' },
  { id: 'p5', concept: 'Plástico PP — 1.500 kg', supplier: 'Polímeros del Plata', amount: 2_900_000, date: addDays(TODAY, 10), certainty: 'Confirmado', category: 'Materia prima' },
  { id: 'p6', concept: 'Inyección lote 27', supplier: 'Inyectora Ensenada', amount: 1_150_000, date: addDays(TODAY, 13), certainty: 'Confirmado', category: 'Producción' },
  { id: 'p7', concept: 'IVA septiembre (estimado)', supplier: 'ARCA', amount: 900_000, date: addDays(TODAY, 16), certainty: 'Proyectado', category: 'Impuestos' },
]

// ————— Drill-down: resumen → detalle → origen del dato —————

export interface DrillNode {
  id: string
  label: string
  value: number
  sub?: string
  children?: DrillNode[]
  origin?: { source: string; batch: string; importedAt: string; by: string; row: number; doc: string }
}

const origin = (doc: string, row: number, source = 'Dux Sauver · Gastos') => ({
  source, batch: '#184', importedAt: '27/09 10:42', by: 'Carla', row, doc,
})

export const DRILL_GASTOS: DrillNode = {
  id: 'g', label: 'Gastos de septiembre', value: 5_120_400, sub: 'Sin compras de inventario',
  children: [
    {
      id: 'g-prod', label: 'Producción', value: 2_310_000, sub: '45 % del total',
      children: [
        {
          id: 'g-iny', label: 'Inyección', value: 1_690_000, sub: '2 movimientos',
          children: [
            {
              id: 'g-iny-ens', label: 'Inyectora Ensenada', value: 1_690_000, sub: 'Proveedor',
              children: [
                { id: 'mv1', label: 'FC A 0002-00004410 · Lote 25', value: 1_020_000, sub: '08/09', origin: origin('FC A 0002-00004410', 212) },
                { id: 'mv2', label: 'FC A 0002-00004452 · Lote 26', value: 670_000, sub: '22/09', origin: origin('FC A 0002-00004452', 298) },
              ],
            },
          ],
        },
        {
          id: 'g-flete', label: 'Fletes de producción', value: 620_000, sub: '4 movimientos',
          children: [
            { id: 'mv3', label: 'Transportes Río · 4 viajes', value: 620_000, sub: 'sep', origin: origin('FC B 0001-00000871', 240) },
          ],
        },
      ],
    },
    {
      id: 'g-est', label: 'Estructura', value: 1_540_000, sub: '30 % del total',
      children: [
        { id: 'mv4', label: 'Alquiler depósito La Plata', value: 620_000, sub: '05/09', origin: origin('Recibo 0001-00000312', 118) },
        { id: 'mv5', label: 'Honorarios contador', value: 380_000, sub: '10/09', origin: origin('FC C 0003-00000211', 150) },
        { id: 'mv6', label: 'Servicios y software', value: 540_000, sub: '8 movimientos', origin: origin('Varios', 160) },
      ],
    },
    {
      id: 'g-com', label: 'Comercial', value: 860_400, sub: '17 % del total',
      children: [
        { id: 'mv7', label: 'Comisiones vendedor (agosto)', value: 512_400, sub: '05/09', origin: origin('Liquidación 08/26', 121) },
        { id: 'mv8', label: 'Viáticos y combustible', value: 348_000, sub: '12 movimientos', origin: origin('Varios', 170) },
      ],
    },
    {
      id: 'g-otros', label: 'Otros', value: 410_000, sub: '8 % del total',
      children: [{ id: 'mv9', label: 'Gastos bancarios', value: 410_000, sub: 'sep', origin: origin('Extracto', 301) }],
    },
  ],
}

const vorigin = (doc: string, row: number) => ({
  source: 'Dux Sauver · Ventas por comprobante', batch: '#183', importedAt: '27/09 10:38', by: 'Carla', row, doc,
})

export const DRILL_VENTAS: DrillNode = {
  id: 'v', label: 'Ventas de septiembre (real)', value: 19_400_000, sub: 'Netas de IVA · al 26/09',
  children: [
    {
      id: 'v-dist', label: 'Distribuidores', value: 12_900_000, sub: '66 % · 5 clientes',
      children: [
        {
          id: 'v-norte', label: 'Distribuidora Norte', value: 5_780_000, sub: '3 comprobantes',
          children: [
            { id: 'fv1', label: 'FA 0003-00018840', value: 2_140_000, sub: '19/09', origin: vorigin('FA 0003-00018840', 88) },
            { id: 'fv2', label: 'FA 0003-00018812', value: 1_980_000, sub: '10/09', origin: vorigin('FA 0003-00018812', 54) },
            { id: 'fv3', label: 'FA 0003-00018779', value: 1_660_000, sub: '02/09', origin: vorigin('FA 0003-00018779', 12) },
          ],
        },
        { id: 'v-oeste', label: 'Mayorista Oeste', value: 2_950_000, sub: '2 comprobantes' },
        { id: 'v-sur', label: 'Distribuidora del Sur', value: 1_890_000, sub: '1 comprobante' },
        { id: 'v-lumen', label: 'Distribuidora Lumen', value: 1_480_000, sub: '1 comprobante' },
        { id: 'v-otros-d', label: 'Otros', value: 800_000, sub: '1 cliente' },
      ],
    },
    { id: 'v-kio', label: 'Kioscos', value: 3_700_000, sub: '19 % · 38 clientes' },
    { id: 'v-tab', label: 'Tabaquerías', value: 2_100_000, sub: '11 % · 14 clientes' },
    { id: 'v-grow', label: 'Growshops', value: 700_000, sub: '4 % · 7 clientes' },
  ],
}

// ————— Insights con evidencia —————

export interface Insight {
  id: string
  tone: 'good' | 'warn' | 'info' | 'crit'
  title: string
  body: string
  evidence: string
  href?: string
}

export const INSIGHTS: Insight[] = [
  {
    id: 'i1', tone: 'good', title: 'Kingsize +18 % en unidades',
    body: '6.900 u. en septiembre contra 5.850 u. de promedio en jun–ago.',
    evidence: 'Ventas por producto · Dux Sauver al 26/09',
  },
  {
    id: 'i2', tone: 'warn', title: '6 clientes fuera de frecuencia',
    body: '2 distribuidores y 4 kioscos superaron su frecuencia habitual en más de 5 días.',
    evidence: 'Frecuencia histórica de 12 meses · Dux Sauver', href: 'clientes',
  },
  {
    id: 'i3', tone: 'info', title: '$ 2,9 M a cobrar en 5 días',
    body: '6 comprobantes; el 46 % es de Distribuidora Norte, con fecha comprometida.',
    evidence: 'Cuenta corriente Dux al 26/09 + compromisos cargados',
  },
  {
    id: 'i4', tone: 'crit', title: 'Regular: 23 días de cobertura',
    body: '19.550 u. entre La Plata y San Telmo a 850 u./día. El umbral es 30 días.',
    evidence: 'Stock por depósito Dux al 26/09 · venta 60 días',
  },
  {
    id: 'i5', tone: 'info', title: 'Top 5 clientes = 47 % de las ventas',
    body: 'Distribuidora Norte sola representa el 30 %. La concentración subió 4 puntos en 6 meses.',
    evidence: 'Ventas por cliente · 6 meses',
  },
  {
    id: 'i6', tone: 'good', title: 'Conversión del vendedor: 27 %',
    body: '8 ventas en 30 visitas durante septiembre, contra 21 % en agosto.',
    evidence: 'Visitas registradas en SAUVER App',
  },
]

// ————— Decisiones y alertas —————

export interface Decision {
  id: string
  title: string
  context: string
  data: { label: string; value: string }[]
  options: string[]
  raisedBy: string
  raisedAt: Date
  status: 'pendiente' | 'decidida'
  impact: 'alta' | 'media'
}

export const DECISIONS: Decision[] = [
  {
    id: 'd1', title: 'Distribuidora del Sur pide pasar a 45 días',
    context: 'Compra 22 % menos que hace 6 meses y tiene $ 420 k vencidos. Ofrece volver a su volumen anterior si se extiende el plazo.',
    data: [
      { label: 'Compra mensual 6 m', value: '$ 2,4 M' },
      { label: 'Tendencia', value: '−22 %' },
      { label: 'Días reales de pago', value: '41' },
      { label: 'Impacto en caja', value: '−$ 1,2 M en el valle' },
    ],
    options: ['Mantener 30 días', 'Dar 45 días con límite de $ 3 M', 'Dar 45 días solo si regulariza lo vencido'],
    raisedBy: 'Carla', raisedAt: addDays(TODAY, -1), status: 'pendiente', impact: 'alta',
  },
  {
    id: 'd2', title: 'Adelantar compra de plástico por aumento anunciado',
    context: 'Polímeros del Plata anunció +9 % desde el 15/10. Comprar 1.500 kg extra hoy ahorra unos $ 260 k, pero la caja baja a $ 3,2 M el 14/10.',
    data: [
      { label: 'Ahorro estimado', value: '$ 260 k' },
      { label: 'Valle de caja con la compra', value: '$ 3,2 M' },
      { label: 'Caja mínima', value: '$ 5,0 M' },
      { label: 'Materia prima disponible', value: '38 días' },
    ],
    options: ['No adelantar', 'Adelantar 750 kg', 'Adelantar 1.500 kg y posponer IVA a plan de pagos'],
    raisedBy: 'Sistema', raisedAt: TODAY, status: 'pendiente', impact: 'media',
  },
]

export type Severity = 'critica' | 'atencion' | 'info' | 'ok'

export interface Alert {
  id: string
  severity: Severity
  title: string
  detail: string
  area: 'Finanzas' | 'Stock' | 'Clientes' | 'Datos' | 'Comercial' | 'Administración'
  audience: ('gerencia' | 'admin' | 'vendedor')[]
}

export const ALERTS: Alert[] = [
  {
    id: 'a1', severity: 'critica', title: 'Regular por debajo de 30 días de cobertura',
    detail: '23 días a la velocidad actual. Lote 27 entra el 13/10 (+18.000 u.).', area: 'Stock', audience: ['gerencia', 'admin'],
  },
  {
    id: 'a2', severity: 'atencion', title: 'Falta el reporte de compras de septiembre',
    detail: 'Dux Sauver. El margen y el resultado del mes quedan como provisionales.', area: 'Datos', audience: ['gerencia', 'admin'],
  },
  {
    id: 'a3', severity: 'atencion', title: 'Tabaquería Rivas: $ 480 k vencidos',
    detail: 'Vencido hace 4 días. Compromiso de pago para el viernes 02/10.', area: 'Clientes', audience: ['gerencia', 'admin'],
  },
  {
    id: 'a4', severity: 'atencion', title: 'Pedido P-1038 entregado sin factura vinculada',
    detail: 'Entregado hace 5 días. Revisar si se facturó en Dux.', area: 'Administración', audience: ['admin'],
  },
  {
    id: 'a5', severity: 'info', title: '3 clientes sin vincular con Dux',
    detail: 'Prospectos que ya compraron. Vincularlos evita duplicados.', area: 'Datos', audience: ['admin'],
  },
]

// ————— Datos Dux (cobertura por fuente) —————

export interface CoverageRow {
  report: string
  status: 'ok' | 'parcial' | 'falta' | 'viejo'
  updated: string
  note?: string
}

export const DUX_COVERAGE: { source: string; units: string; rows: CoverageRow[] }[] = [
  {
    source: 'Dux Sauver', units: 'Sauver',
    rows: [
      { report: 'Ventas por comprobante', status: 'ok', updated: '26/09' },
      { report: 'Ventas por producto', status: 'ok', updated: '26/09' },
      { report: 'Cobranzas', status: 'ok', updated: '26/09' },
      { report: 'Cuenta corriente clientes', status: 'ok', updated: '26/09' },
      { report: 'Tesorería (cajas y bancos)', status: 'ok', updated: '26/09' },
      { report: 'Gastos', status: 'ok', updated: '25/09' },
      { report: 'Compras', status: 'falta', updated: '31/08', note: 'Falta septiembre' },
      { report: 'Stock por depósito', status: 'viejo', updated: '21/09', note: 'Tiene 7 días' },
      { report: 'Productos y costos', status: 'parcial', updated: '20/09', note: '18 % de ventas sin costo validado' },
      { report: 'Clientes', status: 'ok', updated: '26/09' },
    ],
  },
  {
    source: 'Dux Joni', units: 'Joni · Grower Things',
    rows: [
      { report: 'Ventas por comprobante', status: 'ok', updated: '25/09' },
      { report: 'Cobranzas', status: 'ok', updated: '25/09' },
      { report: 'Stock', status: 'ok', updated: '25/09' },
      { report: 'Clientes', status: 'ok', updated: '25/09' },
    ],
  },
]
