# Arquitectura aprobada (resumen)

Aprobada al cierre de la Fase 0. Este documento resume las decisiones que guían la construcción.

## Principios

- **Dux es la fuente de verdad** de ventas, compras, gastos, cobros, pagos, saldos de caja/bancos, cuenta corriente, stock por depósito y costos (una vez depurados). SAUVER guarda una copia de solo lectura, fechada y trazable, y nunca la edita.
- **SAUVER es dueño** de lo que Dux no tiene: CRM, visitas, fotos, prospectos, pedidos del vendedor, fechas esperadas de cobro, pagos futuros, caja mínima, proyecciones, escenarios, tareas, controles, cierres, materia prima e insumos por custodio, producción, objetivos, marketing, alertas y decisiones.
- **Dux multi-instancia**: cada instancia (Sauver, Joni) es una fuente vinculada a unidades de negocio. Separación financiera estricta por unidad.
- **Circuito operativo sin doble carga**: WhatsApp → Administración revisa → carga en Dux → SAUVER lo recibe por importación. SAUVER solo tiene un **control diario** (WhatsApp revisado, cobros/pagos/gastos/compras cargados en Dux, día conciliado).
- Pedido ≠ venta ≠ cobro: tres máquinas de estado separadas (logística del pedido, facturación vinculada a Dux, cobranza derivada de Dux).
- Real / Proyectado / Provisional / Escenario nunca se mezclan ambiguamente.
- Caja mínima operativa ≠ capital de trabajo contable.
- Costos con estado de confianza; KPIs dependientes se muestran como **Provisionales** mientras haya costos sin validar.
- Pesos nominales en V1; unidades como métrica física complementaria.
- Cierres con snapshot; cambios posteriores como ajustes visibles.
- Importador Dux reversible, idempotente y auditable.
- Catálogo único de métricas con estado de validación (lo usan dashboards e IA).
- Preguntale a Sauver en V1 limitado a herramientas validadas; si faltan datos, lo dice.

## Stack

Next.js + TypeScript · Tailwind + shadcn/ui + Motion · Supabase (Postgres, Auth con MFA, Storage) · Drizzle · Zod · Inngest/pg-boss · Recharts · react-pdf · SheetJS/ExcelJS · PWA (Serwist + IndexedDB) · Claude API (tool use) · Vercel · Resend · Sentry · PostHog.

## Fases

1. Prototipo navegable con datos ficticios (en curso).
2. Fundaciones y datos Dux.
3. Comercial en producción (piloto del vendedor).
4. Tesorería y tablero de Gerencia real.
5. Operación administrativa y stock.
6. Abastecimiento y producción.
7. Inteligencia V1 (Preguntale a Sauver) y marketing básico.
