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

drop policy if exists "Users can view own orders"   on public.orders;
drop policy if exists "Users can insert own orders" on public.orders;

create policy "Users can view own orders"
  on public.orders for select
  using (user_id = auth.uid());

create policy "Users can insert own orders"
  on public.orders for insert
  with check (user_id = auth.uid());

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

create policy "Users can view own order items"
  on public.order_items for select
  using (
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
