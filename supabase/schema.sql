-- ============================================================
-- PurePlatter Foods — Supabase Schema
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- Run in: Supabase Dashboard > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price > 0),
  weight_kg   numeric(6,2),
  stock_qty   integer not null default 0,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
  on public.products for select
  using (is_active = true);

-- ============================================================
-- PROMOTIONS TABLE
-- ============================================================
create table if not exists public.promotions (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  description       text,
  discount_type     text not null check (discount_type in ('percentage', 'fixed')),
  discount_value    numeric(10,2) not null check (discount_value > 0),
  min_order_amount  numeric(10,2),
  max_uses          integer,
  used_count        integer not null default 0,
  expires_at        timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.promotions enable row level security;

drop policy if exists "Anyone can read active promotions for validation" on public.promotions;
create policy "Anyone can read active promotions for validation"
  on public.promotions for select
  using (is_active = true);

-- ============================================================
-- ORDERS TABLE
-- create table only if it doesn't exist; otherwise just add new columns
-- ============================================================
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  status            text not null default 'pending'
                      check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  total_amount      numeric(10,2) not null,
  payment_status    text default 'pending',
  payment_reference text,
  user_email        text,
  user_full_name    text,
  user_phone        text,
  delivery_address  text,
  delivery_city     text,
  delivery_notes    text,
  shipping_address  jsonb,
  tracking_number   text,
  promo_id          uuid references public.promotions(id) on delete set null,
  discount_amount   numeric(10,2),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Add new columns to existing orders table (safe no-ops if already present)
alter table public.orders add column if not exists promo_id        uuid references public.promotions(id) on delete set null;
alter table public.orders add column if not exists discount_amount numeric(10,2);
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists payment_status  text default 'pending';
alter table public.orders add column if not exists user_email      text;
alter table public.orders add column if not exists user_full_name  text;
alter table public.orders add column if not exists user_phone      text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists delivery_city   text;
alter table public.orders add column if not exists delivery_notes  text;
alter table public.orders add column if not exists updated_at      timestamptz default now();

alter table public.orders enable row level security;

-- Helper: returns true when the calling user is a known admin
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select auth.jwt() ->> 'email' = any(array[
    'puregrainrice@gmail.com',
    'vincentchrisbone@gmail.com'
  ])
$$;

drop policy if exists "Users can view own orders"    on public.orders;
drop policy if exists "Users can insert own orders"  on public.orders;
drop policy if exists "Admins can view all orders"   on public.orders;
drop policy if exists "Admins can insert orders"     on public.orders;
drop policy if exists "Admins can update orders"     on public.orders;

create policy "Users can view own orders"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can insert own orders"
  on public.orders for insert
  with check (user_id = auth.uid());

-- Admins may insert orders with any user_id (including null for walk-in customers)
create policy "Admins can insert orders"
  on public.orders for insert
  with check (public.is_admin());

-- Admins may update any order (status changes, notes, tracking)
create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin());

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  text not null,
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(10,2) not null,
  total_price numeric(10,2) generated always as (quantity * unit_price) stored,
  weight_kg   numeric(6,2),
  created_at  timestamptz not null default now()
);

alter table public.order_items enable row level security;

drop policy if exists "Users can view own order items"   on public.order_items;
drop policy if exists "Users can insert own order items" on public.order_items;
drop policy if exists "Admins can view all order items"  on public.order_items;
drop policy if exists "Admins can insert order items"    on public.order_items;

create policy "Users can view own order items"
  on public.order_items for select
  using (
    public.is_admin() or
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

create policy "Users can insert own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- Admins may insert order items for any order (including in-person sales)
create policy "Admins can insert order items"
  on public.order_items for insert
  with check (public.is_admin());

-- ============================================================
-- DELIVERY CODES TABLE
-- ============================================================
create table if not exists public.delivery_codes (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null unique references public.orders(id) on delete cascade,
  code       text not null unique,
  used       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.delivery_codes enable row level security;

drop policy if exists "Users can view own delivery codes" on public.delivery_codes;

create policy "Users can view own delivery codes"
  on public.delivery_codes for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = delivery_codes.order_id and o.user_id = auth.uid()
    )
  );

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references public.orders(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  product_id  text not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Anyone can read reviews"        on public.reviews;
drop policy if exists "Users can insert own reviews"   on public.reviews;

create policy "Anyone can read reviews"
  on public.reviews for select using (true);

create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (user_id = auth.uid());

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_updated_at     on public.orders;
drop trigger if exists products_updated_at   on public.products;
drop trigger if exists promotions_updated_at on public.promotions;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger promotions_updated_at
  before update on public.promotions
  for each row execute function public.set_updated_at();

-- ============================================================
-- INVOICES TABLES
-- ============================================================
create table if not exists public.invoices (
  id                uuid primary key default gen_random_uuid(),
  invoice_number    text not null unique,
  issue_date        date not null default current_date,
  customer_name     text not null,
  customer_email    text,
  customer_phone    text not null,
  customer_company  text,
  subtotal          numeric(10,2) not null check (subtotal >= 0),
  total             numeric(10,2) not null check (total >= 0),
  public_token      text not null unique,
  emailed_at        timestamptz,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id) on delete cascade,
  product_name  text not null,
  description   text,
  unit_price    numeric(10,2) not null check (unit_price > 0),
  quantity      integer not null check (quantity > 0),
  line_total    numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at    timestamptz not null default now()
);

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

drop policy if exists "Admins can view invoices" on public.invoices;
drop policy if exists "Admins can insert invoices" on public.invoices;
drop policy if exists "Admins can update invoices" on public.invoices;
drop policy if exists "Admins can delete invoices" on public.invoices;
drop policy if exists "Admins can view invoice items" on public.invoice_items;
drop policy if exists "Admins can insert invoice items" on public.invoice_items;
drop policy if exists "Admins can update invoice items" on public.invoice_items;
drop policy if exists "Admins can delete invoice items" on public.invoice_items;

create policy "Admins can view invoices"
  on public.invoices for select
  using (public.is_admin());

create policy "Admins can insert invoices"
  on public.invoices for insert
  with check (public.is_admin());

create policy "Admins can update invoices"
  on public.invoices for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete invoices"
  on public.invoices for delete
  using (public.is_admin());

create policy "Admins can view invoice items"
  on public.invoice_items for select
  using (public.is_admin());

create policy "Admins can insert invoice items"
  on public.invoice_items for insert
  with check (
    public.is_admin() and
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
    )
  );

create policy "Admins can update invoice items"
  on public.invoice_items for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete invoice items"
  on public.invoice_items for delete
  using (public.is_admin());

drop trigger if exists invoices_updated_at on public.invoices;

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ============================================================
-- FARMER SPONSORSHIP + OPERATIONS TABLES
-- ============================================================
create table if not exists public.farmers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text,
  location    text,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.farming_seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  start_date  date,
  end_date    date,
  status      text not null default 'active' check (status in ('planned','active','closed')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.farmer_season_accounts (
  id          uuid primary key default gen_random_uuid(),
  farmer_id   uuid not null references public.farmers(id) on delete cascade,
  season_id   uuid not null references public.farming_seasons(id) on delete cascade,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (farmer_id, season_id)
);

create table if not exists public.warehouses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  location    text,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.farmer_loans (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.farmer_season_accounts(id) on delete cascade,
  loan_date   date not null default current_date,
  amount      numeric(12,2) not null check (amount > 0),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.farmer_repayments (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.farmer_season_accounts(id) on delete cascade,
  warehouse_id   uuid not null references public.warehouses(id) on delete restrict,
  repayment_date date not null default current_date,
  bags           numeric(12,2) not null check (bags > 0),
  price_per_bag  numeric(12,2) not null check (price_per_bag > 0),
  total_amount   numeric(12,2) generated always as (bags * price_per_bag) stored,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.warehouse_stock_movements (
  id              uuid primary key default gen_random_uuid(),
  warehouse_id    uuid not null references public.warehouses(id) on delete cascade,
  season_id       uuid not null references public.farming_seasons(id) on delete cascade,
  farmer_id       uuid references public.farmers(id) on delete set null,
  source_type     text not null default 'manual'
                    check (source_type in ('farmer_repayment','milling_batch','dispatch','manual')),
  source_id       uuid,
  stock_type      text not null check (stock_type in ('paddy','milled')),
  movement_type   text not null check (movement_type in ('received','milled_out','milled_in','dispatched','adjustment')),
  bags            numeric(12,2) not null,
  movement_date   date not null default current_date,
  notes           text,
  created_at      timestamptz not null default now()
);

create table if not exists public.milling_batches (
  id                         uuid primary key default gen_random_uuid(),
  season_id                  uuid not null references public.farming_seasons(id) on delete cascade,
  source_warehouse_id         uuid not null references public.warehouses(id) on delete restrict,
  destination_warehouse_id    uuid not null references public.warehouses(id) on delete restrict,
  milling_date               date not null default current_date,
  paddy_bags                 numeric(12,2) not null check (paddy_bags > 0),
  milled_bags                numeric(12,2) not null check (milled_bags >= 0),
  notes                      text,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create table if not exists public.season_expenses (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references public.farming_seasons(id) on delete cascade,
  expense_date   date not null default current_date,
  category       text not null check (category in ('milling','labour','transportation','other')),
  description    text,
  amount         numeric(12,2) not null check (amount > 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.rice_dispatches (
  id            uuid primary key default gen_random_uuid(),
  season_id     uuid not null references public.farming_seasons(id) on delete cascade,
  warehouse_id  uuid not null references public.warehouses(id) on delete restrict,
  dispatch_date date not null default current_date,
  bags          numeric(12,2) not null check (bags > 0),
  sale_amount   numeric(12,2),
  order_id      uuid references public.orders(id) on delete set null,
  invoice_id    uuid references public.invoices(id) on delete set null,
  recipient     text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Audit/proof metadata for farmer operations. Safe no-ops for existing installs.
alter table public.farmers add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.farmers add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.farming_seasons add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.farming_seasons add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.farmer_season_accounts add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.farmer_season_accounts add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.warehouses add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.warehouses add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.farmer_loans add column if not exists reference_number text;
alter table public.farmer_loans add column if not exists document_url text;
alter table public.farmer_loans add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.farmer_loans add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.farmer_loans add column if not exists voided_at timestamptz;
alter table public.farmer_loans add column if not exists voided_by uuid references auth.users(id) on delete set null;
alter table public.farmer_loans add column if not exists void_reason text;

alter table public.farmer_repayments add column if not exists reference_number text;
alter table public.farmer_repayments add column if not exists document_url text;
alter table public.farmer_repayments add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.farmer_repayments add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.farmer_repayments add column if not exists voided_at timestamptz;
alter table public.farmer_repayments add column if not exists voided_by uuid references auth.users(id) on delete set null;
alter table public.farmer_repayments add column if not exists void_reason text;

alter table public.warehouse_stock_movements add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.warehouse_stock_movements add column if not exists voided_at timestamptz;
alter table public.warehouse_stock_movements add column if not exists voided_by uuid references auth.users(id) on delete set null;
alter table public.warehouse_stock_movements add column if not exists void_reason text;

alter table public.milling_batches add column if not exists reference_number text;
alter table public.milling_batches add column if not exists document_url text;
alter table public.milling_batches add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.milling_batches add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.milling_batches add column if not exists voided_at timestamptz;
alter table public.milling_batches add column if not exists voided_by uuid references auth.users(id) on delete set null;
alter table public.milling_batches add column if not exists void_reason text;

alter table public.season_expenses add column if not exists reference_number text;
alter table public.season_expenses add column if not exists document_url text;
alter table public.season_expenses add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.season_expenses add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.season_expenses add column if not exists voided_at timestamptz;
alter table public.season_expenses add column if not exists voided_by uuid references auth.users(id) on delete set null;
alter table public.season_expenses add column if not exists void_reason text;

alter table public.rice_dispatches add column if not exists reference_number text;
alter table public.rice_dispatches add column if not exists document_url text;
alter table public.rice_dispatches add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.rice_dispatches add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.rice_dispatches add column if not exists voided_at timestamptz;
alter table public.rice_dispatches add column if not exists voided_by uuid references auth.users(id) on delete set null;
alter table public.rice_dispatches add column if not exists void_reason text;

alter table public.warehouse_stock_movements
  drop constraint if exists warehouse_stock_movements_source_type_check;

alter table public.warehouse_stock_movements
  add constraint warehouse_stock_movements_source_type_check
  check (source_type in ('farmer_repayment','milling_batch','dispatch','manual','reversal'));

create table if not exists public.operation_documents (
  id             uuid primary key default gen_random_uuid(),
  resource_type  text not null,
  resource_id    uuid,
  farmer_id      uuid references public.farmers(id) on delete cascade,
  season_id      uuid references public.farming_seasons(id) on delete cascade,
  document_type  text not null default 'other'
                   check (document_type in ('agreement','receipt','waybill','milling_receipt','expense_receipt','photo','other')),
  title          text not null,
  file_url       text not null,
  storage_path   text,
  uploaded_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users(id) on delete set null
);

alter table public.operation_documents add column if not exists updated_at timestamptz not null default now();
alter table public.operation_documents add column if not exists updated_by uuid references auth.users(id) on delete set null;

create table if not exists public.operation_audit_events (
  id             uuid primary key default gen_random_uuid(),
  actor_id       uuid references auth.users(id) on delete set null,
  action         text not null,
  resource_type  text not null,
  resource_id    uuid,
  farmer_id      uuid references public.farmers(id) on delete set null,
  season_id      uuid references public.farming_seasons(id) on delete set null,
  warehouse_id   uuid references public.warehouses(id) on delete set null,
  before_data    jsonb,
  after_data     jsonb,
  reason         text,
  created_at     timestamptz not null default now()
);

alter table public.farmers enable row level security;
alter table public.farming_seasons enable row level security;
alter table public.farmer_season_accounts enable row level security;
alter table public.warehouses enable row level security;
alter table public.farmer_loans enable row level security;
alter table public.farmer_repayments enable row level security;
alter table public.warehouse_stock_movements enable row level security;
alter table public.milling_batches enable row level security;
alter table public.season_expenses enable row level security;
alter table public.rice_dispatches enable row level security;
alter table public.operation_documents enable row level security;
alter table public.operation_audit_events enable row level security;

drop trigger if exists farmers_updated_at on public.farmers;
drop trigger if exists farming_seasons_updated_at on public.farming_seasons;
drop trigger if exists farmer_season_accounts_updated_at on public.farmer_season_accounts;
drop trigger if exists warehouses_updated_at on public.warehouses;
drop trigger if exists farmer_loans_updated_at on public.farmer_loans;
drop trigger if exists farmer_repayments_updated_at on public.farmer_repayments;
drop trigger if exists milling_batches_updated_at on public.milling_batches;
drop trigger if exists season_expenses_updated_at on public.season_expenses;
drop trigger if exists rice_dispatches_updated_at on public.rice_dispatches;
drop trigger if exists operation_documents_updated_at on public.operation_documents;

create trigger farmers_updated_at before update on public.farmers for each row execute function public.set_updated_at();
create trigger farming_seasons_updated_at before update on public.farming_seasons for each row execute function public.set_updated_at();
create trigger farmer_season_accounts_updated_at before update on public.farmer_season_accounts for each row execute function public.set_updated_at();
create trigger warehouses_updated_at before update on public.warehouses for each row execute function public.set_updated_at();
create trigger farmer_loans_updated_at before update on public.farmer_loans for each row execute function public.set_updated_at();
create trigger farmer_repayments_updated_at before update on public.farmer_repayments for each row execute function public.set_updated_at();
create trigger milling_batches_updated_at before update on public.milling_batches for each row execute function public.set_updated_at();
create trigger season_expenses_updated_at before update on public.season_expenses for each row execute function public.set_updated_at();
create trigger rice_dispatches_updated_at before update on public.rice_dispatches for each row execute function public.set_updated_at();
create trigger operation_documents_updated_at before update on public.operation_documents for each row execute function public.set_updated_at();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'farmers',
    'farming_seasons',
    'farmer_season_accounts',
    'warehouses',
    'farmer_loans',
    'farmer_repayments',
    'warehouse_stock_movements',
    'milling_batches',
    'season_expenses',
    'rice_dispatches',
    'operation_documents',
    'operation_audit_events'
  ]
  loop
    execute format('drop policy if exists "Admins can view %1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "Admins can insert %1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "Admins can update %1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "Admins can delete %1$s" on public.%1$I', table_name);
    execute format('create policy "Admins can view %1$s" on public.%1$I for select using (public.is_admin())', table_name);
    execute format('create policy "Admins can insert %1$s" on public.%1$I for insert with check (public.is_admin())', table_name);
    execute format('create policy "Admins can update %1$s" on public.%1$I for update using (public.is_admin()) with check (public.is_admin())', table_name);
    execute format('create policy "Admins can delete %1$s" on public.%1$I for delete using (public.is_admin())', table_name);
  end loop;
end $$;

create or replace function public.operation_stock_balance(
  p_warehouse_id uuid,
  p_season_id uuid,
  p_stock_type text
)
returns numeric
language sql
stable
as $$
  select coalesce(sum(
    case
      when movement_type in ('milled_out','dispatched') then -abs(bags)
      when movement_type = 'adjustment' then bags
      else abs(bags)
    end
  ), 0)
  from public.warehouse_stock_movements
  where warehouse_id = p_warehouse_id
    and season_id = p_season_id
    and stock_type = p_stock_type
    and voided_at is null
$$;

create or replace function public.create_operation_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_before jsonb default null,
  p_after jsonb default null,
  p_reason text default null,
  p_farmer_id uuid default null,
  p_season_id uuid default null,
  p_warehouse_id uuid default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  event_id uuid;
begin
  insert into public.operation_audit_events (
    actor_id,
    action,
    resource_type,
    resource_id,
    before_data,
    after_data,
    reason,
    farmer_id,
    season_id,
    warehouse_id
  )
  values (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_before,
    p_after,
    p_reason,
    p_farmer_id,
    p_season_id,
    p_warehouse_id
  )
  returning id into event_id;

  return event_id;
end;
$$;

create or replace function public.create_farmer_repayment_with_stock(
  p_account_id uuid,
  p_warehouse_id uuid,
  p_repayment_date date,
  p_bags numeric,
  p_price_per_bag numeric,
  p_notes text default null,
  p_reference_number text default null,
  p_document_url text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  account_row public.farmer_season_accounts%rowtype;
  repayment_row public.farmer_repayments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;
  if p_bags <= 0 or p_price_per_bag <= 0 then
    raise exception 'Bags and price per bag must be greater than 0';
  end if;

  select * into account_row
  from public.farmer_season_accounts
  where id = p_account_id;

  if not found then
    raise exception 'Farmer season account not found';
  end if;

  insert into public.farmer_repayments (
    account_id,
    warehouse_id,
    repayment_date,
    bags,
    price_per_bag,
    notes,
    reference_number,
    document_url,
    created_by
  )
  values (
    p_account_id,
    p_warehouse_id,
    coalesce(p_repayment_date, current_date),
    p_bags,
    p_price_per_bag,
    p_notes,
    p_reference_number,
    p_document_url,
    auth.uid()
  )
  returning * into repayment_row;

  insert into public.warehouse_stock_movements (
    warehouse_id,
    season_id,
    farmer_id,
    source_type,
    source_id,
    stock_type,
    movement_type,
    bags,
    movement_date,
    notes,
    created_by
  )
  values (
    p_warehouse_id,
    account_row.season_id,
    account_row.farmer_id,
    'farmer_repayment',
    repayment_row.id,
    'paddy',
    'received',
    p_bags,
    repayment_row.repayment_date,
    'Rice repayment received',
    auth.uid()
  );

  perform public.create_operation_audit_event(
    'create',
    'farmer_repayment',
    repayment_row.id,
    null,
    to_jsonb(repayment_row),
    null,
    account_row.farmer_id,
    account_row.season_id,
    p_warehouse_id
  );

  return repayment_row.id;
end;
$$;

create or replace function public.create_milling_batch_with_stock(
  p_season_id uuid,
  p_source_warehouse_id uuid,
  p_destination_warehouse_id uuid,
  p_milling_date date,
  p_paddy_bags numeric,
  p_milled_bags numeric,
  p_notes text default null,
  p_reference_number text default null,
  p_document_url text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  batch_row public.milling_batches%rowtype;
  available_paddy numeric;
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;
  if p_paddy_bags <= 0 or p_milled_bags < 0 then
    raise exception 'Invalid milling bag quantities';
  end if;

  available_paddy := public.operation_stock_balance(p_source_warehouse_id, p_season_id, 'paddy');
  if available_paddy < p_paddy_bags then
    raise exception 'Not enough paddy stock. Available: %, requested: %', available_paddy, p_paddy_bags;
  end if;

  insert into public.milling_batches (
    season_id,
    source_warehouse_id,
    destination_warehouse_id,
    milling_date,
    paddy_bags,
    milled_bags,
    notes,
    reference_number,
    document_url,
    created_by
  )
  values (
    p_season_id,
    p_source_warehouse_id,
    p_destination_warehouse_id,
    coalesce(p_milling_date, current_date),
    p_paddy_bags,
    p_milled_bags,
    p_notes,
    p_reference_number,
    p_document_url,
    auth.uid()
  )
  returning * into batch_row;

  insert into public.warehouse_stock_movements (
    warehouse_id,
    season_id,
    source_type,
    source_id,
    stock_type,
    movement_type,
    bags,
    movement_date,
    notes,
    created_by
  )
  values
    (p_source_warehouse_id, p_season_id, 'milling_batch', batch_row.id, 'paddy', 'milled_out', p_paddy_bags, batch_row.milling_date, 'Paddy sent for milling', auth.uid()),
    (p_destination_warehouse_id, p_season_id, 'milling_batch', batch_row.id, 'milled', 'milled_in', p_milled_bags, batch_row.milling_date, 'Milled rice received', auth.uid());

  perform public.create_operation_audit_event(
    'create',
    'milling_batch',
    batch_row.id,
    null,
    to_jsonb(batch_row),
    null,
    null,
    p_season_id,
    p_source_warehouse_id
  );

  return batch_row.id;
end;
$$;

create or replace function public.create_rice_dispatch_with_stock(
  p_season_id uuid,
  p_warehouse_id uuid,
  p_dispatch_date date,
  p_bags numeric,
  p_sale_amount numeric default null,
  p_order_id uuid default null,
  p_invoice_id uuid default null,
  p_recipient text default null,
  p_notes text default null,
  p_reference_number text default null,
  p_document_url text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  dispatch_row public.rice_dispatches%rowtype;
  available_milled numeric;
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;
  if p_bags <= 0 then
    raise exception 'Bags must be greater than 0';
  end if;

  available_milled := public.operation_stock_balance(p_warehouse_id, p_season_id, 'milled');
  if available_milled < p_bags then
    raise exception 'Not enough milled stock. Available: %, requested: %', available_milled, p_bags;
  end if;

  insert into public.rice_dispatches (
    season_id,
    warehouse_id,
    dispatch_date,
    bags,
    sale_amount,
    order_id,
    invoice_id,
    recipient,
    notes,
    reference_number,
    document_url,
    created_by
  )
  values (
    p_season_id,
    p_warehouse_id,
    coalesce(p_dispatch_date, current_date),
    p_bags,
    p_sale_amount,
    p_order_id,
    p_invoice_id,
    p_recipient,
    p_notes,
    p_reference_number,
    p_document_url,
    auth.uid()
  )
  returning * into dispatch_row;

  insert into public.warehouse_stock_movements (
    warehouse_id,
    season_id,
    source_type,
    source_id,
    stock_type,
    movement_type,
    bags,
    movement_date,
    notes,
    created_by
  )
  values (
    p_warehouse_id,
    p_season_id,
    'dispatch',
    dispatch_row.id,
    'milled',
    'dispatched',
    p_bags,
    dispatch_row.dispatch_date,
    coalesce('Rice dispatched to ' || nullif(p_recipient, ''), 'Rice dispatched'),
    auth.uid()
  );

  perform public.create_operation_audit_event(
    'create',
    'rice_dispatch',
    dispatch_row.id,
    null,
    to_jsonb(dispatch_row),
    null,
    null,
    p_season_id,
    p_warehouse_id
  );

  return dispatch_row.id;
end;
$$;

create or replace function public.void_operation_record(
  p_resource_type text,
  p_resource_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  before_row jsonb;
  account_row public.farmer_season_accounts%rowtype;
  repayment_row public.farmer_repayments%rowtype;
  batch_row public.milling_batches%rowtype;
  dispatch_row public.rice_dispatches%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Void reason is required';
  end if;

  if p_resource_type = 'loan' then
    select to_jsonb(l) into before_row from public.farmer_loans l where l.id = p_resource_id and l.voided_at is null;
    if before_row is null then raise exception 'Loan not found or already voided'; end if;
    update public.farmer_loans set voided_at = now(), voided_by = auth.uid(), void_reason = p_reason where id = p_resource_id;
    perform public.create_operation_audit_event('void', 'farmer_loan', p_resource_id, before_row, null, p_reason);
  elsif p_resource_type = 'expense' then
    select to_jsonb(e) into before_row from public.season_expenses e where e.id = p_resource_id and e.voided_at is null;
    if before_row is null then raise exception 'Expense not found or already voided'; end if;
    update public.season_expenses set voided_at = now(), voided_by = auth.uid(), void_reason = p_reason where id = p_resource_id;
    perform public.create_operation_audit_event('void', 'season_expense', p_resource_id, before_row, null, p_reason);
  elsif p_resource_type = 'repayment' then
    select * into repayment_row from public.farmer_repayments where id = p_resource_id and voided_at is null;
    if not found then raise exception 'Repayment not found or already voided'; end if;
    select * into account_row from public.farmer_season_accounts where id = repayment_row.account_id;
    before_row := to_jsonb(repayment_row);
    update public.farmer_repayments set voided_at = now(), voided_by = auth.uid(), void_reason = p_reason where id = p_resource_id;
    insert into public.warehouse_stock_movements (warehouse_id, season_id, farmer_id, source_type, source_id, stock_type, movement_type, bags, movement_date, notes, created_by)
    values (repayment_row.warehouse_id, account_row.season_id, account_row.farmer_id, 'reversal', repayment_row.id, 'paddy', 'adjustment', -abs(repayment_row.bags), current_date, 'Void repayment: ' || p_reason, auth.uid());
    perform public.create_operation_audit_event('void', 'farmer_repayment', p_resource_id, before_row, null, p_reason, account_row.farmer_id, account_row.season_id, repayment_row.warehouse_id);
  elsif p_resource_type = 'milling' then
    select * into batch_row from public.milling_batches where id = p_resource_id and voided_at is null;
    if not found then raise exception 'Milling batch not found or already voided'; end if;
    before_row := to_jsonb(batch_row);
    update public.milling_batches set voided_at = now(), voided_by = auth.uid(), void_reason = p_reason where id = p_resource_id;
    insert into public.warehouse_stock_movements (warehouse_id, season_id, source_type, source_id, stock_type, movement_type, bags, movement_date, notes, created_by)
    values
      (batch_row.source_warehouse_id, batch_row.season_id, 'reversal', batch_row.id, 'paddy', 'adjustment', abs(batch_row.paddy_bags), current_date, 'Void milling paddy return: ' || p_reason, auth.uid()),
      (batch_row.destination_warehouse_id, batch_row.season_id, 'reversal', batch_row.id, 'milled', 'adjustment', -abs(batch_row.milled_bags), current_date, 'Void milling output removal: ' || p_reason, auth.uid());
    perform public.create_operation_audit_event('void', 'milling_batch', p_resource_id, before_row, null, p_reason, null, batch_row.season_id, batch_row.source_warehouse_id);
  elsif p_resource_type = 'dispatch' then
    select * into dispatch_row from public.rice_dispatches where id = p_resource_id and voided_at is null;
    if not found then raise exception 'Dispatch not found or already voided'; end if;
    before_row := to_jsonb(dispatch_row);
    update public.rice_dispatches set voided_at = now(), voided_by = auth.uid(), void_reason = p_reason where id = p_resource_id;
    insert into public.warehouse_stock_movements (warehouse_id, season_id, source_type, source_id, stock_type, movement_type, bags, movement_date, notes, created_by)
    values (dispatch_row.warehouse_id, dispatch_row.season_id, 'reversal', dispatch_row.id, 'milled', 'adjustment', abs(dispatch_row.bags), current_date, 'Void dispatch return: ' || p_reason, auth.uid());
    perform public.create_operation_audit_event('void', 'rice_dispatch', p_resource_id, before_row, null, p_reason, null, dispatch_row.season_id, dispatch_row.warehouse_id);
  else
    raise exception 'Unsupported resource type';
  end if;

  return p_resource_id;
end;
$$;

-- ============================================================
-- Auto-increment promo used_count on order insert
-- ============================================================
create or replace function public.increment_promo_used_count()
returns trigger language plpgsql security definer as $$
begin
  if new.promo_id is not null then
    update public.promotions
    set used_count = used_count + 1
    where id = new.promo_id;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_promo_used on public.orders;

create trigger orders_promo_used
  after insert on public.orders
  for each row execute function public.increment_promo_used_count();
