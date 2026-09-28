import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from '@/lib/store'
import { AppShell } from '@/components/shell/AppShell'
import { ChartDefs } from '@/components/charts/ChartKit'
import { GerenciaDashboard } from '@/features/gerencia/Dashboard'
import { Decisiones } from '@/features/gerencia/Decisiones'
import { AdminHoy } from '@/features/admin/Hoy'
import { Tablero } from '@/features/pedidos/Tablero'
import { Clientes } from '@/features/clientes/Clientes'
import { Ficha } from '@/features/clientes/Ficha'
import { Preguntar } from '@/features/sistema/Preguntar'
import { DatosDux } from '@/features/sistema/DatosDux'
import { Placeholder } from '@/features/sistema/Placeholder'
import { Landing } from '@/features/sistema/Landing'
import { DesignSystem } from '@/features/sistema/DesignSystem'
import { VendorShell } from '@/features/vendedor/VendorShell'
import { VendedorHoy } from '@/features/vendedor/Hoy'
import { NuevaVisita } from '@/features/vendedor/NuevaVisita'
import { VendedorPedidos } from '@/features/vendedor/Pedidos'
import { VendedorYo } from '@/features/vendedor/Yo'
import { NAV } from '@/components/shell/nav'

function VisitaRoute() {
  // Una visita nueva cada vez que se entra (aunque ya se esté en la ruta).
  const loc = useLocation()
  return <NuevaVisita key={loc.key} />
}

const phased = (role: 'gerencia' | 'admin') => NAV[role].filter((n) => n.phase)

export default function App() {
  return (
    <AppProvider>
      <ChartDefs />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sistema" element={<DesignSystem />} />

          <Route path="/g" element={<AppShell role="gerencia" />}>
            <Route index element={<GerenciaDashboard />} />
            <Route path="decisiones" element={<Decisiones />} />
            <Route path="preguntar" element={<Preguntar role="gerencia" />} />
            <Route path="pedidos" element={<Tablero canOperate />} />
            <Route path="clientes" element={<Clientes role="gerencia" />} />
            <Route path="clientes/:id" element={<Ficha role="gerencia" />} />
            <Route path="datos" element={<DatosDux canImport={false} />} />
            {phased('gerencia').map((n) => (
              <Route key={n.to} path={n.to.replace('/g/', '')} element={<Placeholder role="gerencia" />} />
            ))}
          </Route>

          <Route path="/a" element={<AppShell role="admin" />}>
            <Route index element={<AdminHoy />} />
            <Route path="pedidos" element={<Tablero canOperate />} />
            <Route path="clientes" element={<Clientes role="admin" />} />
            <Route path="clientes/:id" element={<Ficha role="admin" />} />
            <Route path="preguntar" element={<Preguntar role="admin" />} />
            <Route path="datos" element={<DatosDux canImport />} />
            {phased('admin').map((n) => (
              <Route key={n.to} path={n.to.replace('/a/', '')} element={<Placeholder role="admin" />} />
            ))}
          </Route>

          <Route path="/v" element={<VendorShell />}>
            <Route index element={<VendedorHoy />} />
            <Route path="visita" element={<VisitaRoute />} />
            <Route
              path="clientes"
              element={
                <div className="px-4 pt-4 pb-8">
                  <h1 className="mb-4 text-[24px] font-semibold tracking-tight">Mis clientes</h1>
                  <Clientes role="vendedor" />
                </div>
              }
            />
            <Route
              path="clientes/:id"
              element={
                <div className="px-3 pt-3 pb-8">
                  <Ficha role="vendedor" />
                </div>
              }
            />
            <Route path="pedidos" element={<VendedorPedidos />} />
            <Route path="yo" element={<VendedorYo />} />
            <Route
              path="preguntar"
              element={
                <div className="flex min-h-full flex-col px-4 pt-4">
                  <Preguntar role="vendedor" compact />
                </div>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
