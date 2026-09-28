// Formatos argentinos. Toda la UI pasa por acá para que los números se vean iguales en todas partes.

const intAR = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const dec1AR = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** $ 5.120.400 */
export function ars(n: number): string {
  const sign = n < 0 ? '−' : ''
  return `${sign}$\u00a0${intAR.format(Math.abs(Math.round(n)))}`
}

/** $ 5,1 M · $ 820 k · $ 940 */
export function arsCompact(n: number): string {
  const sign = n < 0 ? '−' : ''
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${sign}$\u00a0${dec1AR.format(a / 1_000_000)}\u00a0M`
  if (a >= 10_000) return `${sign}$\u00a0${intAR.format(Math.round(a / 1000))}\u00a0k`
  return `${sign}$\u00a0${intAR.format(Math.round(a))}`
}

/** 30.000 */
export function int(n: number): string {
  return intAR.format(Math.round(n))
}

/** 30,4 k u. */
export function unitsCompact(n: number): string {
  if (Math.abs(n) >= 10_000) return `${dec1AR.format(n / 1000)}\u00a0k`
  return intAR.format(Math.round(n))
}

/** +12,4 % */
export function pct(n: number, withSign = false): string {
  const s = dec1AR.format(Math.abs(n))
  const sign = n < 0 ? '−' : withSign ? '+' : ''
  return `${sign}${s}\u00a0%`
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const DAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Etiqueta de eje: $24M, $850k */
export function axisMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${intAR.format(Math.round(n / 1_000_000))}M`
  if (Math.abs(n) >= 1000) return `$${intAR.format(Math.round(n / 1000))}k`
  return `$${intAR.format(n)}`
}

/** 27 sep */
export function dayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** 27/09 */
export function ddmm(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthShort(i: number): string {
  return MONTHS[i]
}

export function monthLong(i: number): string {
  return MONTHS_LONG[i]
}

export function weekdayShort(d: Date): string {
  return DAYS[d.getDay()]
}

/** Lunes 28 de septiembre */
export function longDate(d: Date): string {
  const w = DAYS_LONG[d.getDay()]
  return `${w[0].toUpperCase()}${w.slice(1)} ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}
