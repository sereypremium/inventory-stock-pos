-- Run after pos_inventory_schema.sql.
-- This migration moves the app to Supabase Auth + profiles and replaces the
-- broad development policies with authenticated, role-aware RLS policies.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  email text not null,
  full_name text not null default '',
  app_role text not null default 'cashier' check (app_role in ('admin', 'cashier')),
  status text not null default 'active' check (status in ('active', 'inactive'))
);

alter table if exists public.profiles add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table if exists public.profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table if exists public.profiles add column if not exists email text not null default '';
alter table if exists public.profiles add column if not exists full_name text not null default '';
alter table if exists public.profiles add column if not exists app_role text not null default 'cashier';
alter table if exists public.profiles add column if not exists status text not null default 'active';

create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));
create index if not exists profiles_app_role_idx on public.profiles(app_role);
create index if not exists profiles_status_idx on public.profiles(status);

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role text := 'cashier';
  display_name text;
begin
  if not exists (select 1 from public.profiles) then
    default_role := 'admin';
  end if;

  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Store User'
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    app_role,
    status
  )
  values (
    new.id,
    coalesce(new.email, ''),
    display_name,
    default_role,
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_profile();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user_profile();

insert into public.profiles (
  id,
  email,
  full_name,
  app_role,
  status
)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Store User'
  ),
  'cashier',
  'active'
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  updated_at = timezone('utc', now());

do $$
begin
  if not exists (
    select 1
    from public.profiles
    where app_role = 'admin'
      and status = 'active'
  ) then
    update public.profiles
    set
      app_role = 'admin',
      status = 'active',
      updated_at = timezone('utc', now())
    where id = (
      select id
      from public.profiles
      order by created_at asc
      limit 1
    );
  end if;
end $$;

do $$
declare
  target_table text;
  column_type text;
begin
  foreach target_table in array array[
    'brands',
    'categories',
    'products',
    'product_variants',
    'suppliers',
    'purchase_headers',
    'purchase_items',
    'sale_headers',
    'sale_items',
    'system_settings'
  ]
  loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target_table
        and column_name = 'created_by'
    ) then
      execute format(
        'alter table public.%I add column created_by uuid default auth.uid() references auth.users(id) on delete set null',
        target_table
      );
    else
      select data_type
      into column_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target_table
        and column_name = 'created_by';

      if column_type not in ('uuid', 'text', 'character varying') then
        execute format('alter table public.%I alter column created_by drop default', target_table);
        execute format(
          'alter table public.%I alter column created_by type text using created_by::text',
          target_table
        );
        column_type := 'text';
      end if;

      if column_type = 'uuid' then
        execute format('alter table public.%I alter column created_by set default auth.uid()', target_table);
      else
        execute format('alter table public.%I alter column created_by set default auth.uid()::text', target_table);
      end if;
    end if;

    execute format(
      'create index if not exists %I on public.%I(created_by)',
      target_table || '_created_by_idx',
      target_table
    );
  end loop;
end $$;

do $$
declare
  target_table text;
  target_column text;
  column_type text;
begin
  for target_table, target_column in
    select *
    from (
      values
        ('purchase_headers', 'id'),
        ('purchase_headers', 'supplier_id'),
        ('purchase_headers', 'created_by'),
        ('purchase_items', 'id'),
        ('purchase_items', 'purchase_id'),
        ('purchase_items', 'product_id'),
        ('purchase_items', 'variant_id'),
        ('purchase_items', 'created_by'),
        ('sale_headers', 'id'),
        ('sale_headers', 'cashier_id'),
        ('sale_headers', 'created_by'),
        ('sale_items', 'id'),
        ('sale_items', 'sale_id'),
        ('sale_items', 'product_id'),
        ('sale_items', 'variant_id'),
        ('sale_items', 'created_by')
    ) as targets(table_name, column_name)
  loop
    select data_type
    into column_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = target_table
      and column_name = target_column;

    if column_type is null or column_type in ('text', 'character varying', 'uuid') then
      continue;
    end if;

    if target_column = 'created_by' then
      execute format(
        'alter table public.%I alter column %I drop default',
        target_table,
        target_column
      );
    end if;

    execute format(
      'alter table public.%I alter column %I type text using %I::text',
      target_table,
      target_column,
      target_column
    );

    if target_column = 'created_by' then
      execute format(
        'alter table public.%I alter column %I set default auth.uid()::text',
        target_table,
        target_column
      );
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.app_users') is not null then
    execute 'drop policy if exists "app_users_dev_all" on public.app_users';
  end if;
end $$;

drop table if exists public.app_users;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.app_role
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'
  limit 1
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() in ('admin', 'cashier')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'admin'
$$;

revoke all on function public.current_profile_role() from public;
revoke all on function public.is_active_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_headers enable row level security;
alter table public.purchase_items enable row level security;
alter table public.sale_headers enable row level security;
alter table public.sale_items enable row level security;
alter table public.system_settings enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_admin_insert" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
drop policy if exists "profiles_admin_delete" on public.profiles;

create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_admin_insert"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

create policy "profiles_admin_update"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "brands_dev_all" on public.brands;
drop policy if exists "categories_dev_all" on public.categories;
drop policy if exists "products_dev_all" on public.products;
drop policy if exists "product_variants_dev_all" on public.product_variants;
drop policy if exists "suppliers_dev_all" on public.suppliers;
drop policy if exists "purchase_headers_dev_all" on public.purchase_headers;
drop policy if exists "purchase_items_dev_all" on public.purchase_items;
drop policy if exists "sale_headers_dev_all" on public.sale_headers;
drop policy if exists "sale_items_dev_all" on public.sale_items;
drop policy if exists "system_settings_dev_all" on public.system_settings;

drop policy if exists "brands_staff_select" on public.brands;
drop policy if exists "brands_admin_insert" on public.brands;
drop policy if exists "brands_admin_update" on public.brands;
drop policy if exists "brands_admin_delete" on public.brands;
create policy "brands_staff_select" on public.brands for select to authenticated using (public.is_active_staff());
create policy "brands_admin_insert" on public.brands for insert to authenticated with check (public.is_admin());
create policy "brands_admin_update" on public.brands for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "brands_admin_delete" on public.brands for delete to authenticated using (public.is_admin());

drop policy if exists "categories_staff_select" on public.categories;
drop policy if exists "categories_admin_insert" on public.categories;
drop policy if exists "categories_admin_update" on public.categories;
drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_staff_select" on public.categories for select to authenticated using (public.is_active_staff());
create policy "categories_admin_insert" on public.categories for insert to authenticated with check (public.is_admin());
create policy "categories_admin_update" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categories_admin_delete" on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "products_staff_select" on public.products;
drop policy if exists "products_admin_insert" on public.products;
drop policy if exists "products_admin_update" on public.products;
drop policy if exists "products_admin_delete" on public.products;
create policy "products_staff_select" on public.products for select to authenticated using (public.is_active_staff());
create policy "products_admin_insert" on public.products for insert to authenticated with check (public.is_admin());
create policy "products_admin_update" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products_admin_delete" on public.products for delete to authenticated using (public.is_admin());

drop policy if exists "product_variants_staff_select" on public.product_variants;
drop policy if exists "product_variants_admin_insert" on public.product_variants;
drop policy if exists "product_variants_staff_update" on public.product_variants;
drop policy if exists "product_variants_admin_delete" on public.product_variants;
create policy "product_variants_staff_select" on public.product_variants for select to authenticated using (public.is_active_staff());
create policy "product_variants_admin_insert" on public.product_variants for insert to authenticated with check (public.is_admin());
create policy "product_variants_staff_update" on public.product_variants for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy "product_variants_admin_delete" on public.product_variants for delete to authenticated using (public.is_admin());

drop policy if exists "suppliers_staff_select" on public.suppliers;
drop policy if exists "suppliers_admin_insert" on public.suppliers;
drop policy if exists "suppliers_admin_update" on public.suppliers;
drop policy if exists "suppliers_admin_delete" on public.suppliers;
create policy "suppliers_staff_select" on public.suppliers for select to authenticated using (public.is_active_staff());
create policy "suppliers_admin_insert" on public.suppliers for insert to authenticated with check (public.is_admin());
create policy "suppliers_admin_update" on public.suppliers for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "suppliers_admin_delete" on public.suppliers for delete to authenticated using (public.is_admin());

drop policy if exists "purchase_headers_staff_select" on public.purchase_headers;
drop policy if exists "purchase_headers_staff_insert" on public.purchase_headers;
drop policy if exists "purchase_headers_staff_update" on public.purchase_headers;
drop policy if exists "purchase_headers_staff_delete_own" on public.purchase_headers;
drop policy if exists "purchase_headers_admin_insert" on public.purchase_headers;
drop policy if exists "purchase_headers_admin_update" on public.purchase_headers;
drop policy if exists "purchase_headers_admin_delete" on public.purchase_headers;
create policy "purchase_headers_staff_select" on public.purchase_headers for select to authenticated using (public.is_active_staff());
create policy "purchase_headers_admin_insert" on public.purchase_headers for insert to authenticated with check (public.is_admin());
create policy "purchase_headers_admin_update" on public.purchase_headers for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "purchase_headers_admin_delete" on public.purchase_headers for delete to authenticated using (public.is_admin());

drop policy if exists "purchase_items_staff_select" on public.purchase_items;
drop policy if exists "purchase_items_staff_insert" on public.purchase_items;
drop policy if exists "purchase_items_staff_update" on public.purchase_items;
drop policy if exists "purchase_items_staff_delete_own" on public.purchase_items;
drop policy if exists "purchase_items_admin_insert" on public.purchase_items;
drop policy if exists "purchase_items_admin_update" on public.purchase_items;
drop policy if exists "purchase_items_admin_delete" on public.purchase_items;
create policy "purchase_items_staff_select" on public.purchase_items for select to authenticated using (public.is_active_staff());
create policy "purchase_items_admin_insert" on public.purchase_items for insert to authenticated with check (public.is_admin());
create policy "purchase_items_admin_update" on public.purchase_items for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "purchase_items_admin_delete" on public.purchase_items for delete to authenticated using (public.is_admin());

drop policy if exists "sale_headers_staff_select" on public.sale_headers;
drop policy if exists "sale_headers_staff_insert" on public.sale_headers;
drop policy if exists "sale_headers_staff_delete_own" on public.sale_headers;
create policy "sale_headers_staff_select" on public.sale_headers for select to authenticated using (public.is_active_staff());
create policy "sale_headers_staff_insert" on public.sale_headers for insert to authenticated with check (public.is_active_staff() and created_by::text = auth.uid()::text);
create policy "sale_headers_staff_delete_own" on public.sale_headers for delete to authenticated using (public.is_admin() or created_by::text = auth.uid()::text);

drop policy if exists "sale_items_staff_select" on public.sale_items;
drop policy if exists "sale_items_staff_insert" on public.sale_items;
drop policy if exists "sale_items_staff_delete_own" on public.sale_items;
create policy "sale_items_staff_select" on public.sale_items for select to authenticated using (public.is_active_staff());
create policy "sale_items_staff_insert" on public.sale_items for insert to authenticated with check (public.is_active_staff() and created_by::text = auth.uid()::text);
create policy "sale_items_staff_delete_own" on public.sale_items for delete to authenticated using (public.is_admin() or created_by::text = auth.uid()::text);

drop policy if exists "system_settings_staff_select" on public.system_settings;
drop policy if exists "system_settings_admin_insert" on public.system_settings;
drop policy if exists "system_settings_admin_update" on public.system_settings;
drop policy if exists "system_settings_admin_delete" on public.system_settings;
create policy "system_settings_staff_select" on public.system_settings for select to authenticated using (public.is_active_staff());
create policy "system_settings_admin_insert" on public.system_settings for insert to authenticated with check (public.is_admin());
create policy "system_settings_admin_update" on public.system_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "system_settings_admin_delete" on public.system_settings for delete to authenticated using (public.is_admin());

commit;
