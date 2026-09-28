// DATOS FICTICIOS — usuarios del prototipo. Joni es la única persona real (Gerencia);
// el vendedor y la persona de Administración tienen nombres inventados.

export type Role = 'gerencia' | 'admin' | 'vendedor'

export interface User {
  id: string
  name: string
  initials: string
  role: Role
  roleLabel: string
}

export const USERS: Record<Role, User> = {
  gerencia: { id: 'u-joni', name: 'Joni', initials: 'J', role: 'gerencia', roleLabel: 'Gerencia' },
  admin: { id: 'u-carla', name: 'Carla', initials: 'C', role: 'admin', roleLabel: 'Administración' },
  vendedor: { id: 'u-tomas', name: 'Tomás', initials: 'T', role: 'vendedor', roleLabel: 'Vendedor' },
}
