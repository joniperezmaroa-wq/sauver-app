# SAUVER App — Prototipo Fase 1

Prototipo navegable para aprobar **diseño, navegación, experiencia mobile, dashboards y flujo del vendedor** antes de construir la lógica real.

> **Todo es ficticio**: clientes, montos, pedidos, personas (salvo Joni), productos y presentaciones. No hay conexión con Dux ni lógica financiera definitiva. El estado vive en memoria: al recargar la página vuelve a los datos de ejemplo.

## Ejecutar

```bash
cd prototype
npm install
npm run dev          # http://localhost:5173 (también accesible desde el celular en la misma red)
```

Otros comandos:

```bash
npm run build        # build estático en dist/
npm run build:single # un único HTML autocontenido en dist-single/ (para compartir por enlace)
npm run typecheck
```

## Qué incluye

- **Inicio**: elegir experiencia (Gerencia, Administración, Vendedor) y acceso al sistema de diseño.
- **Gerencia**: dashboard (frase-estado, KPIs héroe, ventas vs punto de equilibrio, caja real/proyectada con valle y caja mínima, a cobrar/a pagar, insights con evidencia, comercial, cobertura, clientes), drill-down hasta el origen del dato, decisiones pendientes, Preguntale a Sauver, pedidos, clientes y Datos Dux.
- **Administración**: “Hoy” con control diario WhatsApp → Dux, tareas por tramo (vencidas/hoy/7 días/mes) con completar, posponer, nota y escalar; pedidos nuevos, cobranzas, pagos, Datos Dux, cierre y alertas; tablero de pedidos con detalle, “Copiar para Dux” y vista del PDF.
- **Vendedor** (mobile; en computadora se ve dentro de un marco de teléfono): Hoy con objetivos y ruta sugerida, visita en pasos (cliente → foto → resultado → pedido → listo), prospecto nuevo, catálogo con “repetir último pedido”, resumen por unidad de negocio, mis pedidos, ficha del cliente, “Yo” con objetivos y comisión.
- **Sistema de diseño** (`#/sistema`): tokens, tipografía, lenguaje Real/Proyectado/Provisional/Escenario y componentes, en tema claro y oscuro.

Un pedido enviado desde el vendedor aparece al instante en el tablero de Administración (misma sesión).

## Estructura

```
src/
  styles/index.css      tokens de diseño (claro/oscuro) y tema Tailwind
  components/ui/        componentes base reutilizables
  components/charts/    gráficos (ventas vs equilibrio, caja proyectada)
  components/shell/     navegación, buscador ⌘K, selector de rol
  features/             pantallas por experiencia
  data/                 datos ficticios (marcados como tales)
  lib/                  formato es-AR, estado en memoria, tema
```

El prototipo usa Vite para poder publicarse como un único archivo. Los componentes, tokens y pantallas son React + Tailwind y se trasladan a la app Next.js en la Fase 2.
