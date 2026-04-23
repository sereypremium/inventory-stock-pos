-- Align products and product_variants with the enterprise-clean frontend schema.
-- Run this after the base inventory schema and before enabling strict production RLS.

begin;

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null default '',
  style_code text not null default '',
  brand_id text not null default '',
  category_id text not null default '',
  target_group text not null default 'unisex',
  base_price numeric(12, 2) not null default 0,
  image_url text,
  description text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.products add column if not exists product_name text;
alter table public.products add column if not exists style_code text;
alter table public.products add column if not exists brand_id text;
alter table public.products add column if not exists category_id text;
alter table public.products add column if not exists target_group text;
alter table public.products add column if not exists base_price numeric(12, 2);
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists description text;
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
      and column_name = 'model_name'
  ) then
    execute '
      update public.products
      set product_name = coalesce(nullif(product_name::text, ''''), nullif(model_name::text, ''''), product_name::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'name'
  ) then
    execute '
      update public.products
      set product_name = coalesce(nullif(product_name::text, ''''), nullif(name::text, ''''), product_name::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'product_code'
  ) then
    execute '
      update public.products
      set style_code = coalesce(nullif(style_code::text, ''''), nullif(product_code::text, ''''), style_code::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'gender'
  ) then
    execute '
      update public.products
      set target_group = coalesce(nullif(target_group::text, ''''), nullif(gender::text, ''''), ''unisex'')
    ';
  end if;
end $$;

update public.products
set
  product_name = coalesce(nullif(product_name::text, ''), 'Unnamed Product'),
  style_code = upper(coalesce(nullif(style_code::text, ''), 'PRD-' || upper(left(replace(id::text, '-', ''), 8)))),
  brand_id = coalesce(brand_id::text, ''),
  category_id = coalesce(category_id::text, ''),
  target_group = coalesce(nullif(target_group::text, ''), 'unisex'),
  base_price = coalesce(base_price, 0),
  description = coalesce(description::text, ''),
  status = coalesce(nullif(status::text, ''), 'active'),
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
  id_type text;
  invalid_products integer;
begin
  select data_type
  into id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'products'
    and column_name = 'id';

  if id_type <> 'uuid' then
    select count(*)
    into invalid_products
    from public.products
    where id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

    if invalid_products > 0 then
      raise exception
        'Cannot convert public.products.id to uuid: % product ids are not UUID values. Fix those ids before running this migration.',
        invalid_products;
    end if;

    alter table public.products alter column id type uuid using id::uuid;
  end if;
end $$;

alter table public.products alter column id set default gen_random_uuid();
alter table public.products alter column product_name set not null;
alter table public.products alter column product_name set default '';
alter table public.products alter column style_code set not null;
alter table public.products alter column style_code set default '';
alter table public.products alter column brand_id set not null;
alter table public.products alter column brand_id set default '';
alter table public.products alter column category_id set not null;
alter table public.products alter column category_id set default '';
alter table public.products alter column target_group set not null;
alter table public.products alter column target_group set default 'unisex';
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
alter table public.products drop constraint if exists products_target_group_check;
alter table public.products add constraint products_target_group_check
  check (target_group in ('men', 'women', 'unisex', 'kids'));

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('active', 'inactive'));

drop index if exists public.products_product_code_idx;
drop index if exists public.products_style_code_idx;
create unique index products_style_code_idx on public.products(style_code);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);

alter table public.products drop column if exists product_code;
alter table public.products drop column if exists model_name;
alter table public.products drop column if exists gender;
alter table public.products drop column if exists name;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  sku text not null default '',
  barcode text,
  size text not null default '',
  color text not null default '',
  cost_price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  stock_qty integer not null default 0,
  min_stock_qty integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.product_variants add column if not exists product_id uuid;
alter table public.product_variants add column if not exists sku text;
alter table public.product_variants add column if not exists barcode text;
alter table public.product_variants add column if not exists size text;
alter table public.product_variants add column if not exists color text;
alter table public.product_variants add column if not exists cost_price numeric(12, 2);
alter table public.product_variants add column if not exists sale_price numeric(12, 2);
alter table public.product_variants add column if not exists stock_qty integer;
alter table public.product_variants add column if not exists min_stock_qty integer;
alter table public.product_variants add column if not exists status text;
alter table public.product_variants add column if not exists created_at timestamptz;

update public.product_variants
set
  sku = upper(coalesce(nullif(sku::text, ''), 'SKU-' || upper(left(replace(id::text, '-', ''), 8)))),
  barcode = nullif(barcode::text, ''),
  size = coalesce(nullif(size::text, ''), 'OS'),
  color = coalesce(nullif(color::text, ''), 'Default'),
  cost_price = coalesce(cost_price, 0),
  sale_price = coalesce(sale_price, 0),
  stock_qty = coalesce(stock_qty, 0),
  min_stock_qty = coalesce(min_stock_qty, 0),
  status = coalesce(nullif(status::text, ''), 'active'),
  created_at = coalesce(created_at, timezone('utc', now()));

do $$
declare
  product_id_type text;
  invalid_product_ids integer;
  missing_product_ids integer;
begin
  select data_type
  into product_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'product_variants'
    and column_name = 'product_id';

  if product_id_type <> 'uuid' then
    select count(*)
    into invalid_product_ids
    from public.product_variants
    where product_id is not null
      and product_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

    if invalid_product_ids > 0 then
      raise exception
        'Cannot convert public.product_variants.product_id to uuid: % product_id values are not UUID values.',
        invalid_product_ids;
    end if;

    alter table public.product_variants alter column product_id type uuid using product_id::uuid;
  end if;

  select count(*)
  into missing_product_ids
  from public.product_variants
  where product_id is null;

  if missing_product_ids > 0 then
    raise exception
      'Cannot set public.product_variants.product_id not null: % variants have no product_id.',
      missing_product_ids;
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
alter table public.product_variants alter column sku set not null;
alter table public.product_variants alter column sku set default '';
alter table public.product_variants alter column size set not null;
alter table public.product_variants alter column size set default '';
alter table public.product_variants alter column color set not null;
alter table public.product_variants alter column color set default '';
alter table public.product_variants alter column cost_price set not null;
alter table public.product_variants alter column cost_price set default 0;
alter table public.product_variants alter column sale_price set not null;
alter table public.product_variants alter column sale_price set default 0;
alter table public.product_variants alter column stock_qty set not null;
alter table public.product_variants alter column stock_qty set default 0;
alter table public.product_variants alter column min_stock_qty set not null;
alter table public.product_variants alter column min_stock_qty set default 0;
alter table public.product_variants alter column status set not null;
alter table public.product_variants alter column status set default 'active';
alter table public.product_variants alter column created_at set not null;
alter table public.product_variants alter column created_at set default timezone('utc', now());

alter table public.product_variants drop constraint if exists product_variants_product_id_fkey;
alter table public.product_variants
  add constraint product_variants_product_id_fkey
  foreign key (product_id)
  references public.products(id)
  on delete restrict;

alter table public.product_variants drop constraint if exists product_variants_status_check;
alter table public.product_variants add constraint product_variants_status_check
  check (status in ('active', 'inactive'));

alter table public.product_variants drop constraint if exists product_variants_product_size_color_unique;
alter table public.product_variants add constraint product_variants_product_size_color_unique
  unique (product_id, size, color);

drop index if exists public.product_variants_sku_idx;
create unique index product_variants_sku_idx on public.product_variants(sku);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_barcode_idx on public.product_variants(barcode);
create index if not exists product_variants_status_idx on public.product_variants(status);

alter table public.product_variants drop column if exists image_url;
alter table public.product_variants drop column if exists updated_at;

commit;

notify pgrst, 'reload schema';
