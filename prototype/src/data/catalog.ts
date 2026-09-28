// DATOS FICTICIOS — catálogo de ejemplo. Los productos, presentaciones y precios reales
// de SAUVER se cargan en la Fase 2 desde Dux.

export type UnitId = 'sauver' | 'joni' | 'grower'

export interface BusinessUnit {
  id: UnitId
  name: string
  short: string
  /** Si impacta en ventas/caja/rentabilidad de SAUVER */
  isSauver: boolean
  duxSource: string
}

export const UNITS: Record<UnitId, BusinessUnit> = {
  sauver: { id: 'sauver', name: 'Sauver', short: 'SV', isSauver: true, duxSource: 'Dux Sauver' },
  joni: { id: 'joni', name: 'Joni', short: 'JN', isSauver: false, duxSource: 'Dux Joni' },
  grower: { id: 'grower', name: 'Grower Things', short: 'GT', isSauver: false, duxSource: 'Dux Joni' },
}

export type StockLevel = 'ok' | 'bajo' | 'sin'

export interface Product {
  id: string
  unit: UnitId
  name: string
  variant: string
  /** Presentación de venta */
  pack: string
  unitsPerPack: number
  /** Precio de lista por pack (con lista mayorista vigente) */
  price: number
  stock: StockLevel
  /** Para el placeholder visual del producto */
  tone: string
  /** Stock por depósito en unidades (solo Sauver) */
  stockLP?: number
  stockST?: number
  /** Venta diaria promedio en unidades (últimos 60 días) */
  dailyUnits?: number
}

export const PRODUCTS: Product[] = [
  {
    id: 'sv-reg', unit: 'sauver', name: 'Sauver Regular', variant: 'Clásico', pack: 'Caja x 50 u.',
    unitsPerPack: 50, price: 24_000, stock: 'bajo', tone: '#0f7a5c', stockLP: 14_200, stockST: 5_350, dailyUnits: 850,
  },
  {
    id: 'sv-ks', unit: 'sauver', name: 'Sauver Kingsize', variant: 'Largo', pack: 'Caja x 50 u.',
    unitsPerPack: 50, price: 31_000, stock: 'ok', tone: '#11624c', stockLP: 21_800, stockST: 8_900, dailyUnits: 410,
  },
  {
    id: 'sv-slim', unit: 'sauver', name: 'Sauver Slim', variant: 'Fino', pack: 'Caja x 50 u.',
    unitsPerPack: 50, price: 27_000, stock: 'ok', tone: '#2f8f71', stockLP: 12_400, stockST: 3_100, dailyUnits: 190,
  },
  {
    id: 'sv-mini', unit: 'sauver', name: 'Sauver Mini', variant: 'Corto', pack: 'Caja x 50 u.',
    unitsPerPack: 50, price: 19_500, stock: 'ok', tone: '#4ea389', stockLP: 9_600, stockST: 2_400, dailyUnits: 120,
  },
  {
    id: 'sv-disp', unit: 'sauver', name: 'Display mixto', variant: 'Regular + Kingsize', pack: 'Display x 120 u.',
    unitsPerPack: 120, price: 62_000, stock: 'ok', tone: '#0b4f3c', stockLP: 3_600, stockST: 1_440, dailyUnits: 60,
  },
  {
    id: 'jn-pap', unit: 'joni', name: 'Papers 1¼', variant: 'Librillo x 50 hojas', pack: 'Display x 25',
    unitsPerPack: 25, price: 21_000, stock: 'ok', tone: '#b0701c',
  },
  {
    id: 'jn-grind', unit: 'joni', name: 'Grinder metálico', variant: '4 partes · 55 mm', pack: 'Unidad',
    unitsPerPack: 1, price: 15_000, stock: 'bajo', tone: '#8a5a17',
  },
  {
    id: 'jn-tips', unit: 'joni', name: 'Tips de cartón', variant: 'Librillo x 50', pack: 'Display x 50',
    unitsPerPack: 50, price: 12_500, stock: 'ok', tone: '#c88a3a',
  },
  {
    id: 'gt-sust', unit: 'grower', name: 'Sustrato premium', variant: 'Bolsa 25 L', pack: 'Unidad',
    unitsPerPack: 1, price: 9_800, stock: 'ok', tone: '#5b6fd6',
  },
]

export function product(id: string): Product {
  const p = PRODUCTS.find((x) => x.id === id)
  if (!p) throw new Error(`Producto desconocido: ${id}`)
  return p
}

/** Descuento máximo que el vendedor puede aplicar sin aprobación */
export const MAX_SELLER_DISCOUNT = 10
