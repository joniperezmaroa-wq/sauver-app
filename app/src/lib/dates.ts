export function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function daysBetween(a: Date, b: Date): number {
  const x = new Date(a)
  const y = new Date(b)
  x.setHours(0, 0, 0, 0)
  y.setHours(0, 0, 0, 0)
  return Math.round((y.getTime() - x.getTime()) / 86_400_000)
}

/** Lunes de la semana de la fecha dada (00:00). */
export function weekStart(d: Date = new Date()): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  const dow = (r.getDay() + 6) % 7
  r.setDate(r.getDate() - dow)
  return r
}

export function relativeDay(d: Date): string {
  const diff = daysBetween(today(), d)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  if (diff < 0) return `Hace ${-diff} días`
  return `En ${diff} días`
}

/** yyyy-mm-dd en hora local */
export function isoDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function timeHM(d: Date): string {
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
