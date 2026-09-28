// El prototipo vive en un "hoy" fijo para que los datos ficticios sean coherentes.
export const TODAY = new Date(2026, 8, 28) // lunes 28 de septiembre de 2026

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function relativeDay(d: Date): string {
  const diff = daysBetween(TODAY, d)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  if (diff < 0) return `Hace ${-diff} días`
  return `En ${diff} días`
}
