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

drop trigger if exists farmers_updated_at on public.farmers;
drop trigger if exists farming_seasons_updated_at on public.farming_seasons;
drop trigger if exists farmer_season_accounts_updated_at on public.farmer_season_accounts;
drop trigger if exists warehouses_updated_at on public.warehouses;
drop trigger if exists farmer_loans_updated_at on public.farmer_loans;
drop trigger if exists farmer_repayments_updated_at on public.farmer_repayments;
drop trigger if exists milling_batches_updated_at on public.milling_batches;
drop trigger if exists season_expenses_updated_at on public.season_expenses;
drop trigger if exists rice_dispatches_updated_at on public.rice_dispatches;

create trigger farmers_updated_at before update on public.farmers for each row execute function public.set_updated_at();
create trigger farming_seasons_updated_at before update on public.farming_seasons for each row execute function public.set_updated_at();
create trigger farmer_season_accounts_updated_at before update on public.farmer_season_accounts for each row execute function public.set_updated_at();
create trigger warehouses_updated_at before update on public.warehouses for each row execute function public.set_updated_at();
create trigger farmer_loans_updated_at before update on public.farmer_loans for each row execute function public.set_updated_at();
create trigger farmer_repayments_updated_at before update on public.farmer_repayments for each row execute function public.set_updated_at();
create trigger milling_batches_updated_at before update on public.milling_batches for each row execute function public.set_updated_at();
create trigger season_expenses_updated_at before update on public.season_expenses for each row execute function public.set_updated_at();
create trigger rice_dispatches_updated_at before update on public.rice_dispatches for each row execute function public.set_updated_at();

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
    'rice_dispatches'
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
