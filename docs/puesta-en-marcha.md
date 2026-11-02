# Puesta en marcha — SAUVER App (versión comercial)

Guía para dejar la app funcionando con usuarios reales. Se hace una sola vez. Nunca hace falta pegar claves en un chat: se copian de una pantalla a la otra.

## 1. Supabase (base de datos, usuarios y fotos)

1. Entrar a <https://supabase.com> con **sauverarg@gmail.com** → **New project**.
   - Nombre: `sauver-app` · Región: **South America (São Paulo)** · Guardar la contraseña de la base en un lugar seguro.
2. Cuando termine de crearse: menú **SQL Editor** → **New query** → pegar **todo** el archivo `supabase/migrations/0001_comercial.sql` → **Run**. Tiene que terminar en "Success".
3. Menú **Authentication** → **URL Configuration**:
   - **Site URL**: la dirección de Vercel del paso 2 (por ejemplo `https://sauver-app.vercel.app`).
   - **Redirect URLs**: agregar la misma dirección con `/**` al final.
4. Menú **Authentication** → **Sign In / Providers** → **Email**: dejar **"Confirm email" activado**. Es lo que garantiza que cada persona es dueña del mail con el que entra.

## 2. Vercel (dónde se publica la app)

1. Entrar a <https://vercel.com> → **Continue with GitHub** → **Add New… → Project** → elegir el repositorio `sauver-app`.
2. En **Root Directory** elegir la carpeta **`app`**. Framework: Vite (lo detecta solo).
3. En **Environment Variables** agregar dos, copiándolas de Supabase → **Project Settings → API**:
   - `VITE_SUPABASE_URL` = *Project URL*
   - `VITE_SUPABASE_ANON_KEY` = *anon public* key (la pública; **no** la `service_role`)
4. **Deploy**. Al terminar, Vercel muestra la dirección de la app. Volver al paso 1.3 de Supabase y cargarla como Site URL.

Cada vez que se publique una mejora en el repositorio, Vercel actualiza la app sola y los celulares toman la versión nueva al reabrirla.

## 3. Usuarios

Quedan habilitados de entrada:

| Persona | Mail | Rol |
|---|---|---|
| Joni | joniperezmaroa@gmail.com | Gerencia |
| Yamila | sauverarg@gmail.com | Administración |

Cada uno entra a la dirección de la app → **Primera vez: crear mi cuenta** → mail y contraseña → abre el mail de confirmación.

Para el vendedor: Joni entra → **Usuarios** → habilita el mail de Ezequiel con rol **Vendedor** → Ezequiel crea su cuenta igual que arriba.

> Supabase manda pocos mails por hora con su servidor gratuito. Alcanza para estos usuarios; si algún mail no llega, esperar unos minutos y usar "Olvidé mi contraseña".

## 4. Antes de que Ezequiel salga a la calle

1. **Productos**: Yamila → **Productos** → *Pegar desde Excel* (columnas: unidad, código, nombre, presentación, unidades por bulto, precio) o cargarlos de a uno.
2. **Ajustes**: confirmar descuento máximo (5 %), depósito (San Telmo), condiciones de pago y si los precios incluyen IVA.
3. **Objetivo semanal** de Ezequiel: **Ajustes → Objetivos semanales**.

## 5. Instalar en el celular de Ezequiel (Android)

1. Abrir la dirección de la app en **Chrome** e ingresar.
2. Menú ⋮ → **Instalar app** (o *Agregar a la pantalla principal*).
3. Queda el ícono de SAUVER como una app más. Funciona sin señal: lo que carga se envía solo al recuperar conexión (el estado se ve arriba en "Hoy").

## Qué hace cada uno

- **Ezequiel**: *Hoy* → **+** → elige o crea el cliente → foto (opcional) → resultado → si compró, arma el pedido → Enviar.
- **Yamila**: *Hoy* ve el pedido nuevo al instante → **Ver** → *Copiar para Dux* (sale separado por Dux Sauver y Dux Joni) → lo carga en Dux → *Marcar cargado en Dux* (con el número) → *Preparando* → *Listo* → *Entregado*. *PDF* para imprimir o mandar. Además, el **control diario** de WhatsApp → Dux.
- **Joni**: ve todo, aprueba descuentos mayores al máximo, habilita usuarios y define objetivos.
