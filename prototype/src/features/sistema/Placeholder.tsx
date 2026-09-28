import { useLocation } from 'react-router-dom'
import { Hammer } from 'lucide-react'
import { NAV } from '@/components/shell/nav'
import type { Role } from '@/data/people'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

/** Módulos previstos en fases posteriores: la navegación existe para evaluar la estructura. */
export function Placeholder({ role }: { role: Role }) {
  const { pathname } = useLocation()
  const item = NAV[role].find((n) => n.to === pathname)
  return (
    <Card className="mx-auto max-w-2xl">
      <EmptyState
        icon={item ? <item.icon size={24} /> : <Hammer size={24} />}
        title={item?.label ?? 'Módulo'}
        body={`Este módulo se construye en la ${item?.phase ?? 'siguiente fase'}. En el prototipo la navegación existe para que puedas evaluar la estructura completa.`}
      />
    </Card>
  )
}
