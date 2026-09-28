// Referencia viva del sistema de diseño: tokens, tipografía, lenguaje de datos y componentes.
// Es la base reutilizable que pasa a la app real en la Fase 2.

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Inbox, Plus } from 'lucide-react'
import { Logo, ThemeSwitch } from '@/components/shell/AppShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SeverityBadge } from '@/components/ui/Badge'
import { DataLegend, DataTag, DataValue, KIND_HELP, KIND_LABEL } from '@/components/ui/DataTag'
import { KpiHero } from '@/components/ui/Kpi'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState, Skeleton } from '@/components/ui/EmptyState'
import { Sparkline } from '@/components/ui/Sparkline'
import { SalesChart } from '@/components/charts/SalesChart'
import { Toaster } from '@/components/ui/Toaster'
import { useApp } from '@/lib/store'
import { useState } from 'react'
import type { DataKind } from '@/data/ask'

const COLORS: { group: string; tokens: { name: string; v: string; note: string }[] }[] = [
  {
    group: 'Superficies y tinta',
    tokens: [
      { name: 'bg', v: '--bg', note: 'Fondo de página' },
      { name: 'surface', v: '--surface', note: 'Tarjetas y paneles' },
      { name: 'surface-3', v: '--surface-3', note: 'Controles, pistas' },
      { name: 'line', v: '--line', note: 'Bordes' },
      { name: 'ink', v: '--ink', note: 'Texto principal' },
      { name: 'ink-2', v: '--ink-2', note: 'Texto secundario' },
      { name: 'muted', v: '--muted', note: 'Etiquetas, ejes' },
    ],
  },
  {
    group: 'Marca y datos',
    tokens: [
      { name: 'accent', v: '--accent', note: 'Marca, acción principal, real' },
      { name: 'accent-soft', v: '--accent-soft', note: 'Fondos de acento' },
      { name: 'prov', v: '--prov', note: 'Provisional' },
      { name: 'scen', v: '--scen', note: 'Escenario simulado' },
      { name: 'series-2', v: '--series-2', note: 'Segunda serie (egresos)' },
    ],
  },
  {
    group: 'Estados (siempre con ícono y texto)',
    tokens: [
      { name: 'good', v: '--good', note: 'Correcto' },
      { name: 'info', v: '--info', note: 'Informativa' },
      { name: 'warn', v: '--warn', note: 'Atención' },
      { name: 'serious', v: '--serious', note: 'Serio' },
      { name: 'crit', v: '--crit', note: 'Crítica' },
    ],
  },
]

const TYPE = [
  { name: 'Display', cls: 'text-[46px] leading-[1.08] font-semibold tracking-[-0.03em]', sample: 'Septiembre' },
  { name: 'Título 1', cls: 'text-[28px] font-semibold tracking-[-0.02em]', sample: 'Buen día, Joni' },
  { name: 'Número KPI', cls: 'num text-[30px] font-semibold tracking-[-0.02em]', sample: '$ 19,4 M' },
  { name: 'Título 2', cls: 'text-[17px] font-semibold', sample: 'Caja real y proyectada' },
  { name: 'Cuerpo', cls: 'text-[14px]', sample: 'La caja se mantiene sobre el mínimo hasta el 14/10.' },
  { name: 'Secundario', cls: 'text-[13px] text-muted', sample: 'Tesorería Dux al 26/09' },
  { name: 'Etiqueta', cls: 'eyebrow', sample: 'Alternativas' },
  { name: 'Datos mono', cls: 'font-mono text-[12px] text-ink-2', sample: 'import #184 · fila 312' },
]

export function DesignSystem() {
  const nav = useNavigate()
  const { toast } = useApp()
  const [seg, setSeg] = useState('a')
  return (
    <div className="h-full overflow-y-auto">
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-6">
          <button onClick={() => nav('/')} className="grid size-9 place-items-center rounded-full hover:bg-surface-3" aria-label="Volver">
            <ArrowLeft size={18} />
          </button>
          <Logo />
          <span className="text-[14px] text-muted">Sistema de diseño</span>
          <div className="flex-1" />
          <ThemeSwitch />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <section className="max-w-3xl">
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em]">Una sola gramática para toda la app</h1>
          <p className="mt-2 text-[15px] text-ink-2">
            Todo se construye con estos tokens y componentes. Cambiar un color o un radio acá lo cambia en las tres experiencias. Probá el tema claro y oscuro arriba a la derecha.
          </p>
        </section>

        {/* Lenguaje de datos */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] font-semibold tracking-tight">Real · Proyectado · Provisional · Escenario</h2>
          <p className="max-w-3xl text-[14px] text-ink-2">
            Nunca se mezclan ambiguamente. Cada número, gráfico y respuesta de la IA declara de qué tipo es, con forma además de color (sólido, punteado, medio lleno, rombo) para que se entienda también sin distinguir colores.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(['real', 'proyectado', 'provisional', 'escenario'] as DataKind[]).map((k) => (
              <Card key={k} className="flex flex-col gap-3 p-4">
                <DataTag kind={k} className="self-start" />
                <div className="text-[28px] font-semibold tracking-tight">
                  <DataValue kind={k}>$ 22,8 M</DataValue>
                </div>
                <p className="text-[13px] text-muted">{KIND_HELP[k]}</p>
                <div className="mt-auto border-t border-line pt-3 text-[12px] text-ink-2">
                  {k === 'real' && 'Barra/línea sólida'}
                  {k === 'proyectado' && 'Barra rayada · línea punteada · prefijo ≈'}
                  {k === 'provisional' && 'Violeta · subrayado punteado · aviso de qué falta'}
                  {k === 'escenario' && 'Azul · solo dentro del simulador'}
                </div>
              </Card>
            ))}
          </div>
          <Card className="py-4">
            <CardHeader title="Aplicado a un gráfico" sub="El mes en curso combina real (sólido) y proyectado (rayado). El punto de equilibrio es provisional." />
            <div className="pt-3">
              <SalesChart height={220} />
            </div>
          </Card>
          <DataLegend kinds={['real', 'proyectado', 'provisional', 'escenario']} />
        </section>

        {/* Color */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] font-semibold tracking-tight">Color</h2>
          {COLORS.map((g) => (
            <div key={g.group} className="flex flex-col gap-2">
              <div className="eyebrow">{g.group}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {g.tokens.map((t) => (
                  <div key={t.name} className="overflow-hidden rounded-2xl border border-line bg-surface">
                    <div className="h-14 border-b border-line" style={{ background: `var(${t.v})` }} />
                    <div className="px-3 py-2">
                      <div className="font-mono text-[12px] font-medium">{t.name}</div>
                      <div className="text-[11.5px] text-muted">{t.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[12.5px] text-muted">
            Paleta de gráficos validada para daltonismo (acento + naranja + azul). Colores de marca provisorios hasta recibir el logo y la identidad de SAUVER.
          </p>
        </section>

        {/* Tipografía */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] font-semibold tracking-tight">Tipografía</h2>
          <p className="text-[14px] text-ink-2">Geist para interfaz y números (cifras tabulares en columnas), Geist Mono para datos técnicos.</p>
          <Card className="divide-y divide-line">
            {TYPE.map((t) => (
              <div key={t.name} className="flex flex-col gap-1 px-5 py-4 md:flex-row md:items-baseline md:gap-6">
                <span className="w-32 shrink-0 text-[12px] text-muted">{t.name}</span>
                <span className={t.cls}>{t.sample}</span>
              </div>
            ))}
          </Card>
        </section>

        {/* Componentes */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] font-semibold tracking-tight">Componentes</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-4 p-5">
              <div className="eyebrow">Botones</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary">
                  <Plus size={16} /> Primario
                </Button>
                <Button>Secundario</Button>
                <Button variant="soft">Suave</Button>
                <Button variant="ghost">Fantasma</Button>
                <Button variant="danger">Cancelar</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" size="xl">
                  Táctil XL
                </Button>
                <Button size="sm">Chico</Button>
              </div>
              <div className="eyebrow pt-2">Selector</div>
              <Segmented
                value={seg}
                onChange={setSeg}
                options={[
                  { value: 'a', label: 'Mes' },
                  { value: 'b', label: '3 meses', count: 3 },
                  { value: 'c', label: 'Año' },
                ]}
              />
              <div className="eyebrow pt-2">Feedback</div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => toast({ title: 'Visita registrada', body: '+1 nuevo punto de venta' })}>Mostrar confirmación</Button>
                <Button onClick={() => toast({ title: 'Tarea completada', action: { label: 'Deshacer', onClick: () => undefined } })}>Con deshacer</Button>
              </div>
            </Card>

            <Card className="flex flex-col gap-4 p-5">
              <div className="eyebrow">Estados y severidad</div>
              <div className="flex flex-wrap gap-2">
                <SeverityBadge severity="critica" />
                <SeverityBadge severity="atencion" />
                <SeverityBadge severity="info" />
                <SeverityBadge severity="ok" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">Prospecto</Badge>
                <Badge tone="accent">Nuevo</Badge>
                <Badge tone="good">Activo</Badge>
                <Badge tone="warn">En riesgo</Badge>
                <Badge>Inactivo</Badge>
              </div>
              <div className="eyebrow pt-2">Progreso</div>
              <div className="flex items-center gap-5">
                <ProgressRing value={78} size={64} stroke={7}>
                  <span className="num text-[14px] font-semibold">78%</span>
                </ProgressRing>
                <div className="flex flex-1 flex-col gap-3">
                  <ProgressBar value={8} max={12} />
                  <ProgressBar value={19.4} projected={3.4} max={24} />
                </div>
              </div>
              <div className="eyebrow pt-2">Tendencia</div>
              <div className="flex items-center gap-6">
                <Sparkline data={[3, 4, 3.6, 5, 4.8, 6, 5.6, 7]} />
                <Sparkline data={[5, 4.4, 4.8, 4.1, 3.9, 3.2, 3.5, 2.9]} color="var(--series-2)" projectedFrom={5} />
              </div>
            </Card>

            <KpiHero
              label="Resultado del mes"
              kind="provisional"
              value="$ 1,9 M"
              sub="Cierre proyectado"
              footer={<span className="text-prov">Falta el reporte de compras de septiembre</span>}
            />

            <Card className="flex flex-col gap-3 p-5">
              <div className="eyebrow">Carga (skeleton)</div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-24 w-full" />
            </Card>

            <Card className="lg:col-span-2">
              <EmptyState
                icon={<Inbox size={24} />}
                title="Todavía no importaste ventas de octubre"
                body="Los tableros de octubre se completan cuando Administración suba el reporte de Dux."
                action={<Button variant="primary">Importar reporte</Button>}
              />
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-line pt-6 text-[13.5px] text-ink-2">
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">Principios</h2>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[
              'Resumen → proyección → detalle → origen del dato.',
              'Las tablas no son la puerta de entrada: se llega desde tarjetas y gráficos.',
              'Movimiento corto (150–250 ms) y con intención; respeta "reducir movimiento".',
              'Objetivos táctiles de 44 px como mínimo; acción principal al alcance del pulgar.',
              'Los rojos solo significan problema. Estado siempre con ícono y texto.',
              `Tipos de dato: ${Object.values(KIND_LABEL).join(', ')}.`,
            ].map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {p}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Toaster />
    </div>
  )
}
