// Preguntale a Sauver — SIMULADO. En el prototipo no hay IA real: cada pregunta sugerida
// tiene una respuesta armada a mano que muestra cómo se va a ver (texto + números con
// evidencia + gráfico + herramientas consultadas + advertencias de datos).

import type { Role } from './people'

export type DataKind = 'real' | 'proyectado' | 'provisional' | 'escenario'

export interface AnswerNumber {
  label: string
  value: string
  kind: DataKind
  sub?: string
}

export type AnswerBlock =
  | { type: 'text'; text: string }
  | { type: 'numbers'; items: AnswerNumber[] }
  | { type: 'chart'; chart: 'sales-vs-be' | 'cash-60' }
  | { type: 'list'; title: string; rows: { label: string; value: string; sub?: string; kind?: DataKind }[] }
  | { type: 'warning'; text: string }
  | { type: 'insufficient'; text: string; missing: string[] }
  | { type: 'denied'; text: string }

export interface Answer {
  tools: string[]
  blocks: AnswerBlock[]
  evidence: string[]
}

export interface Suggestion {
  q: string
  a: Answer
}

const COMO_VIENE: Answer = {
  tools: ['obtener_metrica(ventas, sep)', 'obtener_metrica(punto_equilibrio, sep)', 'proyeccion_cierre_mes()'],
  blocks: [
    {
      type: 'text',
      text: 'Septiembre viene bien en ventas: llevás $ 19,4 M facturados al 26/09 y el cierre proyectado es de ≈ $ 22,8 M, un 13 % por encima del punto de equilibrio. En unidades el mes queda en ≈ 38,6 k, 6 % más que agosto.',
    },
    {
      type: 'numbers',
      items: [
        { label: 'Ventas al 26/09', value: '$ 19,4 M', kind: 'real', sub: '33,2 k unidades' },
        { label: 'Cierre del mes', value: '≈ $ 22,8 M', kind: 'proyectado', sub: 'rango $ 22,1 – 23,4 M' },
        { label: 'Punto de equilibrio', value: '$ 20,1 M', kind: 'provisional', sub: 'costos 82 % validados' },
        { label: 'Resultado del mes', value: '≈ $ 1,9 M', kind: 'provisional' },
      ],
    },
    { type: 'chart', chart: 'sales-vs-be' },
    {
      type: 'warning',
      text: 'El resultado y el punto de equilibrio son provisionales: falta el reporte de compras de septiembre y el 18 % de las ventas usa costos sin validar.',
    },
  ],
  evidence: ['Ventas por comprobante · Dux Sauver · import #183 (27/09)', 'Gastos · Dux Sauver · import #184 (27/09)'],
}

const PEOR_DIA: Answer = {
  tools: ['proyeccion_caja(60 días, esperado)'],
  blocks: [
    {
      type: 'text',
      text: 'El peor día de caja de los próximos 60 días es el miércoles 14 de octubre, con ≈ $ 6,1 M. Queda $ 1,1 M por encima de tu caja mínima de $ 5,0 M. El valle lo generan los sueldos (02/10), la compra de plástico (08/10) y el pago de inyección del lote 27 (11/10), antes de los cobros de distribuidores del 17/10.',
    },
    {
      type: 'numbers',
      items: [
        { label: 'Caja hoy', value: '$ 9,8 M', kind: 'real', sub: 'Tesorería Dux al 26/09' },
        { label: 'Valle (14/10)', value: '≈ $ 6,1 M', kind: 'proyectado' },
        { label: 'Caja mínima', value: '$ 5,0 M', kind: 'real', sub: 'configurada por Gerencia' },
      ],
    },
    { type: 'chart', chart: 'cash-60' },
  ],
  evidence: ['Tesorería · Dux Sauver al 26/09', '7 pagos programados en SAUVER App', 'Cuenta corriente clientes · Dux al 26/09'],
}

const COBRAR_SEMANA: Answer = {
  tools: ['listar_cobranzas(próximos 7 días)'],
  blocks: [
    { type: 'text', text: 'Esta semana tenés ≈ $ 2,9 M para cobrar en 6 comprobantes. El 46 % es de Distribuidora Norte, con fecha comprometida para el jueves.' },
    {
      type: 'list',
      title: 'Cobros esperados',
      rows: [
        { label: 'Kiosco El Faro', value: '$ 186.000', sub: 'mar 29 · vencido, comprometido' },
        { label: 'Mayorista Oeste', value: '$ 610.000', sub: 'mié 30 · vence' },
        { label: 'Kiosco 24 Horas', value: '$ 112.000', sub: 'mié 30 · vence' },
        { label: 'Distribuidora Norte', value: '$ 1.380.000', sub: 'jue 01 · comprometido' },
        { label: 'Growshop Raíz Verde', value: '$ 205.000', sub: 'vie 02 · vence' },
        { label: 'Tabaquería Rivas', value: '$ 480.000', sub: 'vie 02 · vencido, comprometido' },
      ],
    },
  ],
  evidence: ['Cuenta corriente clientes · Dux Sauver al 26/09', 'Fechas comprometidas cargadas por Administración'],
}

const DISTRIBUIDORES: Answer = {
  tools: ['desglosar(ventas_unidades, cliente, canal=Distribuidor, 6 meses)'],
  blocks: [
    { type: 'text', text: 'Dos distribuidores compran menos que hace 6 meses si se mide en unidades, que no están afectadas por la inflación:' },
    {
      type: 'list',
      title: 'Unidades · últimos 3 meses vs 3 anteriores',
      rows: [
        { label: 'Distribuidora del Sur', value: '−26 %', sub: 'última compra hace 34 días (frecuencia 21)', kind: 'real' },
        { label: 'Distribuidora Lumen', value: '−12 %', sub: 'última compra hace 29 días (frecuencia 21)', kind: 'real' },
        { label: 'Distribuidora Norte', value: '+6 %', sub: 'en frecuencia', kind: 'real' },
        { label: 'Mayorista Oeste', value: '+11 %', sub: 'en frecuencia', kind: 'real' },
      ],
    },
  ],
  evidence: ['Ventas por producto y cliente · Dux Sauver · 12 meses'],
}

const MARGEN: Answer = {
  tools: ['obtener_metrica(margen_bruto, sep)'],
  blocks: [
    {
      type: 'insufficient',
      text: 'No tengo datos suficientes para explicar la variación del margen con confianza.',
      missing: [
        'Reporte de compras de septiembre (Dux Sauver)',
        'Costos validados para 3 productos que suman el 18 % de las ventas',
      ],
    },
    {
      type: 'text',
      text: 'Con los datos actuales, el margen bruto provisional es 41,2 % contra 42,6 % en agosto, pero esa diferencia está dentro de lo que pueden mover los costos pendientes. Cuando se importen las compras y se validen los costos te respondo con el detalle por producto.',
    },
  ],
  evidence: ['Productos y costos · Dux Sauver al 20/09 (parcial)'],
}

const MARKETING: Answer = {
  tools: ['proyeccion_caja(60 días, esperado)', 'obtener_metrica(caja_minima)'],
  blocks: [
    {
      type: 'text',
      text: 'Hoy podrías comprometer hasta ≈ $ 1,1 M sin que la caja baje de tu mínimo en ningún día de los próximos 60. Si lo repartís después del 17/10, cuando entran los cobros de distribuidores, el margen sube a ≈ $ 3,4 M.',
    },
    {
      type: 'numbers',
      items: [
        { label: 'Caja libre hoy', value: '≈ $ 1,1 M', kind: 'proyectado', sub: 'valle $ 6,1 M − mínimo $ 5,0 M' },
        { label: 'Caja libre desde 17/10', value: '≈ $ 3,4 M', kind: 'proyectado' },
      ],
    },
    { type: 'warning', text: 'Es un cálculo sobre el escenario esperado. En el escenario conservador (cobros +10 días) la caja libre hoy es cero.' },
  ],
  evidence: ['Tesorería · Dux Sauver al 26/09', 'Pagos programados y proyectados en SAUVER App'],
}

const ADMIN_HOY: Answer = {
  tools: ['mis_tareas(hoy)', 'estado_datos_dux()'],
  blocks: [
    { type: 'text', text: 'Hoy tenés 4 tareas y 2 vencidas. Lo más urgente es importar las compras de septiembre, porque bloquea el cierre.' },
    {
      type: 'list',
      title: 'Pendiente',
      rows: [
        { label: 'Importar compras de septiembre', value: 'Vencida', sub: 'Dux Sauver' },
        { label: 'Compromiso de cobro — Kiosco El Faro', value: 'Vencida', sub: '$ 186.000' },
        { label: 'Control diario', value: '2 de 6', sub: 'faltan pagos, gastos, compras y conciliación' },
        { label: 'Pedidos nuevos', value: '2', sub: 'P-1045 y P-1046' },
      ],
    },
  ],
  evidence: ['Tareas de SAUVER App', 'Cobertura Datos Dux'],
}

const ADMIN_CIERRE: Answer = {
  tools: ['estado_cierre(sep)'],
  blocks: [
    { type: 'text', text: 'El cierre de septiembre está al 67 %. Faltan 3 ítems:' },
    {
      type: 'list',
      title: 'Pendientes del cierre',
      rows: [
        { label: 'Reportes Dux completos', value: 'Falta compras' },
        { label: 'Costos actualizados', value: '3 productos' },
        { label: 'Control físico de stock', value: 'Coordinar con Ramón' },
      ],
    },
  ],
  evidence: ['Checklist de cierre · septiembre'],
}

const V_VISITAR: Answer = {
  tools: ['a_quien_visitar(hoy)'],
  blocks: [
    { type: 'text', text: 'Hoy te conviene arrancar por Kiosco La Estación (revisita programada) y Candy Club (recompra en 2 días). Kiosco El Faro está 7 días demorado.' },
    {
      type: 'list',
      title: 'Sugeridos para hoy',
      rows: [
        { label: 'Kiosco La Estación', value: 'Revisita', sub: 'Tolosa · llevar muestra' },
        { label: 'Candy Club', value: 'Recompra', sub: 'La Plata · suele llevar Regular x3' },
        { label: 'Kiosco El Faro', value: 'Demorado', sub: 'Berisso · 7 días' },
        { label: 'Bohemia Tabacos', value: 'Prospecto', sub: 'San Telmo · pidió volver hoy' },
      ],
    },
  ],
  evidence: ['Tus visitas y seguimientos', 'Frecuencia de compra de tus clientes'],
}

const V_VENDI: Answer = {
  tools: ['mis_ventas(mes)', 'mis_objetivos()'],
  blocks: [
    {
      type: 'numbers',
      items: [
        { label: 'Vendido en septiembre', value: '$ 8,6 M', kind: 'real', sub: '82 % del objetivo' },
        { label: 'Comisión estimada', value: '$ 186.400', kind: 'proyectado', sub: 'sobre lo facturado' },
      ],
    },
    { type: 'text', text: 'Te faltan $ 1,9 M para el objetivo del mes. Con tu ticket promedio son unas 12 ventas.' },
  ],
  evidence: ['Tus pedidos facturados · Dux Sauver y Dux Joni'],
}

const V_MARGEN: Answer = {
  tools: [],
  blocks: [{ type: 'denied', text: 'No tengo acceso a información de costos ni de rentabilidad de Sauver con tu usuario. Puedo ayudarte con tus ventas, clientes, pedidos y objetivos.' }],
  evidence: [],
}

export const SUGGESTIONS: Record<Role, Suggestion[]> = {
  gerencia: [
    { q: '¿Cómo viene septiembre?', a: COMO_VIENE },
    { q: '¿Cuál es mi peor día de caja de los próximos 60 días?', a: PEOR_DIA },
    { q: '¿Cuánto tengo que cobrar esta semana?', a: COBRAR_SEMANA },
    { q: '¿Qué distribuidores están comprando menos?', a: DISTRIBUIDORES },
    { q: '¿Por qué bajó el margen?', a: MARGEN },
    { q: '¿Cuánto puedo invertir en marketing sin bajar de la caja mínima?', a: MARKETING },
  ],
  admin: [
    { q: '¿Qué tengo pendiente hoy?', a: ADMIN_HOY },
    { q: '¿Qué falta para cerrar septiembre?', a: ADMIN_CIERRE },
    { q: '¿Cuánto hay que cobrar esta semana?', a: COBRAR_SEMANA },
  ],
  vendedor: [
    { q: '¿A quién debo visitar hoy?', a: V_VISITAR },
    { q: '¿Cuánto vendí este mes?', a: V_VENDI },
    { q: '¿Cuál es el margen de Sauver?', a: V_MARGEN },
  ],
}

export const FALLBACK: Answer = {
  tools: [],
  blocks: [
    {
      type: 'text',
      text: 'En este prototipo las respuestas están simuladas. Probá con una de las preguntas sugeridas para ver cómo responde Sauver con datos, evidencia y advertencias.',
    },
  ],
  evidence: [],
}

export function findAnswer(role: Role, q: string): Answer {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?]/g, '').trim()
  const n = norm(q)
  const exact = SUGGESTIONS[role].find((s) => norm(s.q) === n)
  if (exact) return exact.a
  const keywords: [string[], Answer][] =
    role === 'gerencia'
      ? [
          [['septiembre', 'mes', 'viene'], COMO_VIENE],
          [['peor', 'caja', 'valle'], PEOR_DIA],
          [['cobrar'], COBRAR_SEMANA],
          [['distribuidor'], DISTRIBUIDORES],
          [['margen'], MARGEN],
          [['marketing', 'invertir'], MARKETING],
        ]
      : role === 'admin'
        ? [
            [['pendiente', 'hoy', 'tareas'], ADMIN_HOY],
            [['cierre', 'cerrar'], ADMIN_CIERRE],
            [['cobrar'], COBRAR_SEMANA],
          ]
        : [
            [['visitar', 'visita'], V_VISITAR],
            [['vendi', 'vendido', 'comision'], V_VENDI],
            [['margen', 'costo', 'rentabilidad', 'ganancia', 'caja'], V_MARGEN],
          ]
  for (const [keys, a] of keywords) if (keys.some((k) => n.includes(k))) return a
  return FALLBACK
}
