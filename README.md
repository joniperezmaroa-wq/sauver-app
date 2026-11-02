# SAUVER App

Capa de gestión, control, CRM, inteligencia y planificación de SAUVER, construida por encima de Dux (que sigue siendo el sistema transaccional).

| Carpeta | Contenido |
|---|---|
| `app/` | **App operativa** (V1 comercial): vendedor mobile con funcionamiento sin señal, visitas con foto, pedidos, tablero de Administración, clientes, productos, usuarios y ajustes. |
| `supabase/` | Base de datos: tablas, permisos (RLS) y funciones de pedidos. |
| `prototype/` | Fase 1 · prototipo navegable con datos ficticios (referencia de diseño). |
| `docs/` | Arquitectura aprobada y [puesta en marcha](docs/puesta-en-marcha.md). |

## Desarrollo

```bash
cd app
cp .env.example .env.local   # completar con los datos de Supabase
npm install
npm run dev
```
