import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ToastProvider } from '@/lib/toast'
import { isConfigured } from '@/lib/supabase'
import { LoginScreen, NoAccessScreen, NotConfiguredScreen, SetPasswordScreen } from '@/features/auth/AuthScreens'
import { StaffShell, staffBase } from '@/components/shell/StaffShell'
import { VendorShell } from '@/components/shell/VendorShell'
import { Logo } from '@/components/shell/Logo'
import { VendedorHoy } from '@/features/vendedor/Hoy'
import { NuevaVisita } from '@/features/vendedor/NuevaVisita'
import { VendedorYo } from '@/features/vendedor/Yo'
import { Clientes } from '@/features/clientes/Clientes'
import { Ficha } from '@/features/clientes/Ficha'
import { ClienteForm } from '@/features/clientes/ClienteForm'
import { Tablero } from '@/features/pedidos/Tablero'
import { MisPedidos } from '@/features/pedidos/MisPedidos'
import { Imprimir } from '@/features/pedidos/Imprimir'
import { Inicio } from '@/features/admin/Inicio'
import { Productos } from '@/features/config/Productos'
import { Ajustes } from '@/features/config/Ajustes'
import { Usuarios } from '@/features/config/Usuarios'

function VisitaRoute() {
  const loc = useLocation()
  return <NuevaVisita key={loc.key} />
}

function Splash() {
  return (
    <div className="grid h-full place-items-center">
      <div className="animate-pulse">
        <Logo />
      </div>
    </div>
  )
}

function Gate() {
  const { loading, session, profile, recovering } = useAuth()
  if (!isConfigured) return <NotConfiguredScreen />
  if (loading) return <Splash />
  if (recovering && session) return <SetPasswordScreen />
  if (!session) return <LoginScreen />
  if (!profile) return <Splash />
  if (profile.role === 'sin_acceso' || !profile.active) return <NoAccessScreen />

  const staff = profile.role === 'admin' || profile.role === 'gerencia'
  const b = staff ? staffBase(profile.role) : '/v'
  const staffRoutes = (
    <>
      <Route index element={<Inicio />} />
      <Route path="pedidos" element={<Tablero />} />
      <Route path="clientes" element={<Clientes base={b} />} />
      <Route path="clientes/nuevo" element={<ClienteForm base={b} />} />
      <Route path="clientes/:id" element={<Ficha base={b} />} />
      <Route path="clientes/:id/editar" element={<ClienteForm base={b} />} />
      <Route path="productos" element={<Productos />} />
      <Route path="ajustes" element={<Ajustes />} />
      {profile.role === 'gerencia' && <Route path="usuarios" element={<Usuarios />} />}
    </>
  )

  return (
    <Routes>
      <Route path="/imprimir/:id" element={<Imprimir />} />
      {staff ? (
        <Route path={b} element={<StaffShell />}>
          {staffRoutes}
        </Route>
      ) : (
        <Route path="/v" element={<VendorShell />}>
          <Route index element={<VendedorHoy />} />
          <Route path="visita" element={<VisitaRoute />} />
          <Route path="clientes" element={<Clientes base="/v" />} />
          <Route path="clientes/nuevo" element={<ClienteForm base="/v" />} />
          <Route path="clientes/:id" element={<Ficha base="/v" />} />
          <Route path="clientes/:id/editar" element={<ClienteForm base="/v" />} />
          <Route path="pedidos" element={<MisPedidos />} />
          <Route path="yo" element={<VendedorYo />} />
        </Route>
      )}
      <Route path="*" element={<Navigate to={b} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Gate />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
