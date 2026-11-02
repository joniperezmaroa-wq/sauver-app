-- SAUVER App · V1 comercial (vendedor + pedidos + administración)
-- Ejecutar una sola vez en Supabase → SQL Editor. Es idempotente en lo posible.
--
-- Principios:
--  * Los permisos se aplican en la base (RLS + funciones), no en la pantalla.
--  * Los precios de un pedido los calcula el servidor; el celular solo manda cantidades.
--  * Nada importante se borra: se archiva (active = false) y queda auditado.

create extension if not exists pgcrypto;

-- ─────────────────────────────── Usuarios y roles ───────────────────────────────

create table if not exists public.business_units (
  id text primary key,
  name text not null,
  is_sauver boolean not null default false,
  dux_source text not null
);

insert into public.business_units (id, name, is_sauver, dux_source) values
  ('sauver', 'Sauver', true, 'Dux Sauver'),
  ('joni', 'Joni', false, 'Dux Joni'),
  ('grower', 'Grower Things', false, 'Dux Joni')
on conflict (id) do nothing;

-- Mails habilitados y su rol. Quien no esté acá puede tener cuenta pero no ve nada.
create table if not exists public.allowed_users (
  email text primary key,
  full_name text not null,
  role text not null check (role in ('gerencia', 'admin', 'vendedor')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'sin_acceso' check (role in ('gerencia', 'admin', 'vendedor', 'sin_acceso')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rol del usuario actual (los chequeos de permisos usan esto).
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid() and active),
    'sin_acceso'
  )
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() in ('gerencia', 'admin')
$$;

-- Al crearse una cuenta en Supabase Auth se crea su perfil con el rol habilitado.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  a public.allowed_users;
begin
  select * into a from public.allowed_users where lower(email) = lower(new.email);
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(a.full_name, ''), coalesce(a.role, 'sin_acceso'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si se habilita un mail que ya tenía cuenta, se actualiza su rol.
create or replace function public.sync_allowed_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set role = new.role, full_name = new.full_name, active = true
   where lower(email) = lower(new.email);
  return new;
end $$;

drop trigger if exists allowed_users_sync on public.allowed_users;
create trigger allowed_users_sync after insert or update on public.allowed_users
  for each row execute function public.sync_allowed_user();

-- ─────────────────────────────── Utilidades ───────────────────────────────

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  table_name text not null,
  row_id text,
  action text not null,
  before jsonb,
  after jsonb
);

create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor, table_name, row_id, action, before, after)
  values (
    auth.uid(),
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
             (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'customer_id'),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

-- ─────────────────────────────── Configuración ───────────────────────────────

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  max_discount numeric not null default 5,
  default_warehouse text not null default 'San Telmo',
  prices_include_vat boolean not null default false,
  payment_terms text[] not null default array['Contado', '7 días', '15 días', '30 días', '45 días'],
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.seller_targets (
  seller_id uuid primary key references public.profiles (id),
  weekly_sales numeric not null default 0,
  weekly_visits int not null default 12,
  weekly_new_customers int not null default 2,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────── Catálogo ───────────────────────────────

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_unit text not null references public.business_units (id),
  code text,
  name text not null,
  presentation text not null default '',
  units_per_pack int not null default 1 check (units_per_pack > 0),
  price numeric not null default 0 check (price >= 0),
  active boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_price_history (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products (id),
  old_price numeric,
  new_price numeric not null,
  changed_at timestamptz not null default now(),
  changed_by uuid
);

create or replace function public.track_price() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.price is distinct from old.price then
    insert into public.product_price_history (product_id, old_price, new_price, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.price end, new.price, auth.uid());
  end if;
  return new;
end $$;

-- ─────────────────────────────── Clientes ───────────────────────────────

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),   -- lo genera el celular (funciona sin señal)
  name text not null,
  legal_name text,
  cuit text,
  channel text not null default 'Kiosco',
  zone text,
  address text,
  contact_name text,
  whatsapp text,
  email text,
  payment_term text not null default 'Contado',
  status text not null default 'prospecto' check (status in ('prospecto', 'activo', 'inactivo')),
  notes text,
  owner_id uuid not null references public.profiles (id),
  dux_code_sauver text,
  dux_code_joni text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_owner_idx on public.customers (owner_id);

-- Saldo y vencido: los carga Administración (más adelante llegan del import de Dux).
create table if not exists public.customer_balances (
  customer_id uuid primary key references public.customers (id),
  balance numeric not null default 0,
  overdue numeric not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

-- ─────────────────────────────── Visitas ───────────────────────────────

create table if not exists public.visits (
  id uuid primary key,                              -- lo genera el celular
  customer_id uuid not null references public.customers (id),
  seller_id uuid not null references public.profiles (id) default auth.uid(),
  visited_at timestamptz not null default now(),
  outcome text not null check (outcome in ('compro', 'interesado', 'volver', 'no_interesado', 'no_hablo')),
  interest text[] not null default '{}',
  objections text[] not null default '{}',
  reason text,
  next_visit date,
  comment text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists visits_customer_idx on public.visits (customer_id);
create index if not exists visits_seller_idx on public.visits (seller_id, visited_at desc);

-- ─────────────────────────────── Pedidos ───────────────────────────────

create table if not exists public.orders (
  id uuid primary key,                              -- lo genera el celular
  number bigint generated always as identity (start with 1001) unique,
  customer_id uuid not null references public.customers (id),
  seller_id uuid not null references public.profiles (id),
  visit_id uuid references public.visits (id),
  status text not null default 'nuevo'
    check (status in ('nuevo', 'recibido', 'cargado_dux', 'preparando', 'listo', 'entregado', 'cancelado')),
  payment_term text not null,
  discount_pct numeric not null default 0 check (discount_pct >= 0 and discount_pct <= 50),
  needs_approval boolean not null default false,
  warehouse text not null default 'San Telmo',
  notes text,
  dux_ref_sauver text,
  dux_ref_joni text,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_seller_idx on public.orders (seller_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  business_unit text not null references public.business_units (id),
  product_name text not null,
  presentation text not null default '',
  packs int not null check (packs > 0),
  list_price numeric not null,
  discount_pct numeric not null default 0,
  subtotal numeric not null,
  updated_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  at timestamptz not null default now(),
  by uuid default auth.uid(),
  status text,
  label text not null,
  updated_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id);

-- ─────────────────────────────── Control diario (Administración) ───────────────────────────────

create table if not exists public.daily_checks (
  day date not null,
  item text not null,
  done boolean not null default false,
  by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (day, item)
);

-- ─────────────────────────────── Triggers ───────────────────────────────

do $$
declare t text;
begin
  foreach t in array array['profiles', 'app_settings', 'seller_targets', 'products', 'customers',
                           'customer_balances', 'visits', 'orders', 'order_items', 'order_events', 'daily_checks']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
  foreach t in array array['profiles', 'allowed_users', 'app_settings', 'seller_targets', 'products',
                           'customers', 'customer_balances', 'orders']
  loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row()', t);
  end loop;
end $$;

drop trigger if exists products_price_history on public.products;
create trigger products_price_history after insert or update on public.products
  for each row execute function public.track_price();

-- ─────────────────────────────── Permisos (RLS) ───────────────────────────────

alter table public.business_units enable row level security;
alter table public.allowed_users enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.app_settings enable row level security;
alter table public.seller_targets enable row level security;
alter table public.products enable row level security;
alter table public.product_price_history enable row level security;
alter table public.customers enable row level security;
alter table public.customer_balances enable row level security;
alter table public.visits enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.daily_checks enable row level security;

-- Limpia políticas previas para poder re-ejecutar el archivo.
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy bu_read on public.business_units for select to authenticated using (true);

create policy allowed_read on public.allowed_users for select to authenticated using (public.my_role() = 'gerencia');
create policy allowed_write on public.allowed_users for all to authenticated
  using (public.my_role() = 'gerencia') with check (public.my_role() = 'gerencia');

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() in ('gerencia', 'admin', 'vendedor'));
create policy profiles_write on public.profiles for update to authenticated
  using (public.my_role() = 'gerencia') with check (public.my_role() = 'gerencia');

create policy audit_read on public.audit_log for select to authenticated using (public.my_role() = 'gerencia');

create policy settings_read on public.app_settings for select to authenticated using (public.my_role() <> 'sin_acceso');
create policy settings_write on public.app_settings for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy targets_read on public.seller_targets for select to authenticated
  using (seller_id = auth.uid() or public.is_staff());
create policy targets_write on public.seller_targets for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy products_read on public.products for select to authenticated using (public.my_role() <> 'sin_acceso');
create policy products_write on public.products for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy price_history_read on public.product_price_history for select to authenticated using (public.is_staff());

create policy customers_read on public.customers for select to authenticated
  using (public.is_staff() or owner_id = auth.uid());
create policy customers_insert on public.customers for insert to authenticated
  with check (public.is_staff() or (public.my_role() = 'vendedor' and owner_id = auth.uid()));
create policy customers_update on public.customers for update to authenticated
  using (public.is_staff() or owner_id = auth.uid())
  with check (public.is_staff() or owner_id = auth.uid());

create policy balances_read on public.customer_balances for select to authenticated
  using (public.is_staff() or exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid()));
create policy balances_write on public.customer_balances for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy visits_read on public.visits for select to authenticated
  using (public.is_staff() or seller_id = auth.uid());
create policy visits_insert on public.visits for insert to authenticated
  with check (
    seller_id = auth.uid()
    and (public.is_staff() or exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid()))
  );
create policy visits_update on public.visits for update to authenticated
  using (seller_id = auth.uid() or public.is_staff()) with check (seller_id = auth.uid() or public.is_staff());

-- Pedidos: se crean y cambian de estado solo por funciones (ver abajo). Lectura según rol.
create policy orders_read on public.orders for select to authenticated
  using (public.is_staff() or seller_id = auth.uid());
create policy items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (public.is_staff() or o.seller_id = auth.uid())));
create policy events_read on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (public.is_staff() or o.seller_id = auth.uid())));

create policy checks_all on public.daily_checks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ─────────────────────────────── Funciones de pedidos ───────────────────────────────

-- Crea un pedido. Idempotente: si el celular lo reenvía (mala señal) no se duplica.
create or replace function public.create_order(p jsonb) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_role text := public.my_role();
  v_order public.orders;
  v_customer public.customers;
  v_settings public.app_settings;
  v_disc numeric := coalesce((p ->> 'discount_pct')::numeric, 0);
  v_item jsonb;
  v_product public.products;
  v_packs int;
  v_sub numeric;
  v_total numeric := 0;
begin
  if v_role not in ('gerencia', 'admin', 'vendedor') then
    raise exception 'Sin permiso para crear pedidos';
  end if;

  select * into v_order from public.orders where id = (p ->> 'id')::uuid;
  if found then
    return v_order;
  end if;

  select * into v_customer from public.customers where id = (p ->> 'customer_id')::uuid;
  if not found then
    raise exception 'Cliente inexistente';
  end if;
  if v_role = 'vendedor' and v_customer.owner_id <> auth.uid() then
    raise exception 'El cliente no pertenece a este vendedor';
  end if;
  if jsonb_array_length(coalesce(p -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  select * into v_settings from public.app_settings where id = 1;

  insert into public.orders (id, customer_id, seller_id, visit_id, payment_term, discount_pct, needs_approval,
                             warehouse, notes, created_at)
  values (
    (p ->> 'id')::uuid,
    v_customer.id,
    auth.uid(),
    nullif(p ->> 'visit_id', '')::uuid,
    coalesce(nullif(p ->> 'payment_term', ''), v_customer.payment_term),
    v_disc,
    v_disc > v_settings.max_discount,
    v_settings.default_warehouse,
    nullif(p ->> 'notes', ''),
    coalesce((p ->> 'created_at')::timestamptz, now())
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p -> 'items') loop
    v_packs := (v_item ->> 'packs')::int;
    if v_packs is null or v_packs <= 0 then
      continue;
    end if;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid and active;
    if not found then
      raise exception 'Producto inexistente o inactivo';
    end if;
    v_sub := round(v_packs * v_product.price * (1 - v_disc / 100));
    v_total := v_total + v_sub;
    insert into public.order_items (order_id, product_id, business_unit, product_name, presentation, packs,
                                    list_price, discount_pct, subtotal)
    values (v_order.id, v_product.id, v_product.business_unit, v_product.name, v_product.presentation, v_packs,
            v_product.price, v_disc, v_sub);
  end loop;

  update public.orders set total = v_total where id = v_order.id returning * into v_order;

  insert into public.order_events (order_id, status, label)
  values (v_order.id, 'nuevo',
          case when v_order.needs_approval then 'Pedido enviado · descuento a aprobar' else 'Pedido enviado' end);

  -- Un prospecto que compra pasa a cliente activo.
  update public.customers set status = 'activo' where id = v_customer.id and status = 'prospecto';

  return v_order;
end $$;

-- Cambia el estado (Administración / Gerencia).
create or replace function public.set_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null,
  p_dux_sauver text default null,
  p_dux_joni text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_labels jsonb := '{"nuevo":"Nuevo","recibido":"Recibido por Administración","cargado_dux":"Cargado en Dux",
                      "preparando":"En preparación","listo":"Listo para entregar","entregado":"Entregado",
                      "cancelado":"Cancelado"}';
begin
  if not public.is_staff() then
    raise exception 'Sin permiso';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pedido inexistente';
  end if;
  if v_order.status = 'cancelado' then
    raise exception 'El pedido está cancelado';
  end if;

  update public.orders
     set status = p_status,
         dux_ref_sauver = coalesce(nullif(p_dux_sauver, ''), dux_ref_sauver),
         dux_ref_joni = coalesce(nullif(p_dux_joni, ''), dux_ref_joni)
   where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, status, label)
  values (p_order_id, p_status,
          (v_labels ->> p_status)
            || case when nullif(p_dux_sauver, '') is not null then ' · Dux Sauver ' || p_dux_sauver else '' end
            || case when nullif(p_dux_joni, '') is not null then ' · Dux Joni ' || p_dux_joni else '' end
            || case when nullif(p_note, '') is not null then ' · ' || p_note else '' end);
  return v_order;
end $$;

-- Cancela: el vendedor solo mientras el pedido está "Nuevo"; Administración hasta antes de entregar.
create or replace function public.cancel_order(p_order_id uuid, p_reason text) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pedido inexistente';
  end if;
  if not (
    (public.is_staff() and v_order.status not in ('entregado', 'cancelado'))
    or (v_order.seller_id = auth.uid() and v_order.status = 'nuevo')
  ) then
    raise exception 'No se puede cancelar este pedido';
  end if;
  update public.orders set status = 'cancelado' where id = p_order_id returning * into v_order;
  insert into public.order_events (order_id, status, label)
  values (p_order_id, 'cancelado', 'Cancelado · ' || coalesce(nullif(p_reason, ''), 'sin motivo'));
  return v_order;
end $$;

-- Aprueba un descuento fuera de rango (solo Gerencia).
create or replace function public.approve_order(p_order_id uuid) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
begin
  if public.my_role() <> 'gerencia' then
    raise exception 'Solo Gerencia aprueba descuentos';
  end if;
  update public.orders set needs_approval = false where id = p_order_id returning * into v_order;
  insert into public.order_events (order_id, status, label) values (p_order_id, v_order.status, 'Descuento aprobado');
  return v_order;
end $$;

-- Las tablas de pedidos no se escriben directo: solo por las funciones de arriba.
revoke insert, update, delete on public.orders, public.order_items, public.order_events from authenticated, anon;
grant execute on function public.create_order(jsonb) to authenticated;
grant execute on function public.set_order_status(uuid, text, text, text, text) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.approve_order(uuid) to authenticated;

-- ─────────────────────────────── Fotos ───────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists fotos_insert on storage.objects;
drop policy if exists fotos_read on storage.objects;
create policy fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy fotos_read on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

-- ─────────────────────────────── Tiempo real ───────────────────────────────

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.orders;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- ─────────────────────────────── Usuarios iniciales ───────────────────────────────

insert into public.allowed_users (email, full_name, role) values
  ('joniperezmaroa@gmail.com', 'Joni', 'gerencia'),
  ('sauverarg@gmail.com', 'Yamila', 'admin')
on conflict (email) do update set full_name = excluded.full_name, role = excluded.role;
-- El vendedor se habilita desde la app (Gerencia → Usuarios) cuando tenga su mail.
