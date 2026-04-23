-- Align products with the current Add/Edit Product form.
-- Run this after the base inventory schema.

begin;

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null default '',
  model_name text not null default '',
  brand_id text not null default '',
  category_id text not null default '',
  gender text not null default 'unisex',
  base_price numeric(12, 2) not null default 0,
  description text not null default '',
  image_url text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.products add column if not exists product_code text;
alter table public.products add column if not exists model_name text;
alter table public.products add column if not exists brand_id text;
alter table public.products add column if not exists category_id text;
alter table public.products add column if not exists gender text;
alter table public.products add column if not exists base_price numeric(12, 2);
alter table public.products add column if not exists description text;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists status text;
alter table public.products add column if not exists created_at timestamptz;
alter table public.products add column if not exists updated_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'style_code'
  ) then
    update public.products
    set product_code = coalesce(nullif(product_code, ''), nullif(style_code::text, ''), product_code);
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'name'
  ) then
    update public.products
    set model_name = coalesce(nullif(model_name, ''), nullif(name::text, ''), model_name);
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'target_group'
  ) then
    update public.products
    set gender = coalesce(nullif(gender, ''), nullif(target_group::text, ''), gender);
  end if;
end $$;

update public.products
set
  product_code = upper(coalesce(nullif(product_code, ''), 'PRD-' || upper(left(replace(id::text, '-', ''), 8)))),
  model_name = coalesce(nullif(model_name, ''), 'Unnamed Product'),
  brand_id = coalesce(brand_id, ''),
  category_id = coalesce(category_id, ''),
  gender = coalesce(nullif(gender, ''), 'unisex'),
  base_price = coalesce(base_price, 0),
  description = coalesce(description, ''),
  status = coalesce(nullif(status, ''), 'active'),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()));

do $$
declare
  constraint_name text;
begin
  if to_regclass('public.product_variants') is null then
    return;
  end if;

  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.product_variants'::regclass
      and confrelid = 'public.products'::regclass
  loop
    execute format('alter table public.product_variants drop constraint %I', constraint_name);
  end loop;
end $$;

do $$
declare
  invalid_products integer;
begin
  select count(*)
  into invalid_products
  from public.products
  where id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

  if invalid_products > 0 then
    raise exception
      'Cannot convert public.products.id to uuid: % product ids are not UUID values. Fix those ids before running this migration.',
      invalid_products;
  end if;
end $$;

do $$
declare
  id_type text;
begin
  select data_type
  into id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'products'
    and column_name = 'id';

  if id_type <> 'uuid' then
    alter table public.products alter column id type uuid using id::uuid;
  end if;
end $$;

alter table public.products alter column id set default gen_random_uuid();
alter table public.products alter column product_code set not null;
alter table public.products alter column model_name set not null;
alter table public.products alter column brand_id set not null;
alter table public.products alter column category_id set not null;
alter table public.products alter column gender set not null;
alter table public.products alter column gender set default 'unisex';
alter table public.products alter column base_price set not null;
alter table public.products alter column base_price set default 0;
alter table public.products alter column description set not null;
alter table public.products alter column description set default '';
alter table public.products alter column status set not null;
alter table public.products alter column status set default 'active';
alter table public.products alter column created_at set not null;
alter table public.products alter column created_at set default timezone('utc', now());
alter table public.products alter column updated_at set not null;
alter table public.products alter column updated_at set default timezone('utc', now());

alter table public.products drop constraint if exists products_gender_check;
alter table public.products add constraint products_gender_check
  check (gender in ('men', 'women', 'unisex', 'kids'));

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('active', 'inactive'));

create unique index if not exists products_product_code_idx on public.products(product_code);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  product_id uuid not null references public.products(id) on delete restrict,
  sku text not null default '',
  barcode text,
  size text not null default '',
  color text not null default '',
  selling_price numeric(12, 2) not null default 0,
  cost_price numeric(12, 2) not null default 0,
  stock_qty integer not null default 0,
  min_stock integer not null default 0,
  status text not null default 'active'
);

alter table public.product_variants add column if not exists product_id uuid;

do $$
declare
  constraint_name text;
  product_id_type text;
  invalid_variants integer;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.product_variants'::regclass
      and confrelid = 'public.products'::regclass
  loop
    execute format('alter table public.product_variants drop constraint %I', constraint_name);
  end loop;

  select data_type
  into product_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'product_variants'
    and column_name = 'product_id';

  if product_id_type <> 'uuid' then
    select count(*)
    into invalid_variants
    from public.product_variants
    where product_id is not null
      and product_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

    if invalid_variants > 0 then
      raise exception
        'Cannot convert public.product_variants.product_id to uuid: % product_id values are not UUID values.',
        invalid_variants;
    end if;

    alter table public.product_variants alter column product_id type uuid using product_id::uuid;
  end if;
end $$;

do $$
declare
  orphan_variants integer;
begin
  select count(*)
  into orphan_variants
  from public.product_variants pv
  left join public.products p on p.id = pv.product_id
  where pv.product_id is not null
    and p.id is null;

  if orphan_variants > 0 then
    raise exception
      'Cannot add product_variants.product_id foreign key: % variants reference missing products.',
      orphan_variants;
  end if;
end $$;

alter table public.product_variants alter column product_id set not null;

alter table public.product_variants
  add constraint product_variants_product_id_fkey
  foreign key (product_id)
  references public.products(id)
  on delete restrict;

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);

commit;
