/** Enlace de WhatsApp a partir de un número argentino tal como lo carga el vendedor. */
export function waLink(raw: string): string {
  let n = raw.replace(/\D/g, '')
  if (n.startsWith('0')) n = n.slice(1)
  if (!n.startsWith('54')) n = '549' + n
  return `https://wa.me/${n}`
}

export function mapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
