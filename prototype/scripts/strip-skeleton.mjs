// Convierte el build autocontenido en el formato de página que acepta el visor de Artifacts:
// sin <!doctype>, <html>, <head> ni <body> (el visor los agrega al publicar).
import { readFileSync, writeFileSync } from 'node:fs'

const file = new URL('../dist-single/index.html', import.meta.url)
let html = readFileSync(file, 'utf8')
html = html
  .replace(/<!doctype html>/i, '')
  .replace(/<html[^>]*>/i, '')
  .replace(/<\/html>/i, '')
  .replace(/<head>/i, '')
  .replace(/<\/head>/i, '')
  .replace(/<body>/i, '')
  .replace(/<\/body>/i, '')
  .replace(/<meta charset="UTF-8" \/>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
  .replace(/<link rel="(icon|manifest)"[^>]*>/gi, '')
  .replace(/<meta name="apple-mobile-web-app-capable"[^>]*>/i, '')
// La etiqueta <title> tiene que quedar en los primeros 8KB.
const title = html.match(/<title>.*?<\/title>/)?.[0] ?? ''
html = title + '\n' + html.replace(title, '')
writeFileSync(new URL('../dist-single/sauver-prototipo.html', import.meta.url), html.trim() + '\n')
console.log('dist-single/sauver-prototipo.html listo (' + Math.round(html.length / 1024) + ' KB)')
