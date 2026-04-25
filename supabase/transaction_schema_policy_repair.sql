-- Run this on projects that already have auth/RLS enabled but still fail stock-in or sales
-- with "created_by" schema cache errors. It is safe to rerun.

begin;

create temporary table if not exists legacy_transaction_target_columns (
  sort_order integer not null,
  table_name text not null,
  column_name text not null,
  primary key (table_name, column_name)
) on commit drop;

insert into legacy_transaction_target_columns (sort_order, table_name, column_name)
values
  (10, 'purchase_items', 'id'),
  (20, 'purchase_items', 'purchase_id'),
  (30, 'purchase_items', 'created_by'),
  (40, 'purchase_headers', 'id'),
  (50, 'purchase_headers', 'created_by'),
  (60, 'sale_items', 'id'),
  (70, 'sale_items', 'sale_id'),
  (80, 'sale_items', 'created_by'),
  (90, 'sale_headers', 'id'),
  (100, 'sale_headers', 'cashier_id'),
  (110, 'sale_headers', 'created_by')
on conflict (table_name, column_name) do nothing;

create temporary table if not exists legacy_transaction_fk_constraints (
  schema_name text not null,
  table_name text not null,
  constraint_name text not null,
  add_statement text not null,
  primary key (schema_name, table_name, constraint_name)
) on commit drop;

insert into legacy_transaction_fk_constraints (schema_name, table_name, constraint_name, add_statement)
select distinct
  source_ns.nspname,
  source_table.relname,
  con.conname,
  format(
    'alter table %I.%I add constraint %I %s',
    source_ns.nspname,
    source_table.relname,
    con.conname,
    pg_get_constraintdef(con.oid)
  )
from pg_constraint con
join pg_class source_table
  on source_table.oid = con.conrelid
join pg_namespace source_ns
  on source_ns.oid = source_table.relnamespace
where con.contype = 'f'
  and source_ns.nspname = 'public'
  and (
    exists (
      select 1
      from unnest(con.conkey) as source_key(attnum)
      join pg_attribute source_attr
        on source_attr.attrelid = con.conrelid
       and source_attr.attnum = source_key.attnum
      join legacy_transaction_target_columns target_column
        on target_column.table_name = source_table.relname
       and target_column.column_name = source_attr.attname
    )
    or exists (
      select 1
      from pg_class target_table
      join pg_namespace target_ns
        on target_ns.oid = target_table.relnamespace
      join unnest(con.confkey) as target_key(attnum)
        on true
      join pg_attribute target_attr
        on target_attr.attrelid = con.confrelid
       and target_attr.attnum = target_key.attnum
      join legacy_transaction_target_columns target_column
        on target_column.table_name = target_table.relname
       and target_column.column_name = target_attr.attname
      where target_table.oid = con.confrelid
        and target_ns.nspname = 'public'
    )
  )
on conflict (schema_name, table_name, constraint_name) do nothing;

do $$
declare
  saved_constraint record;
begin
  for saved_constraint in
    select schema_name, table_name, constraint_name
    from legacy_transaction_fk_constraints
    order by schema_name, table_name, constraint_name
  loop
    execute format(
      'alter table %I.%I drop constraint if exists %I',
      saved_constraint.schema_name,
      saved_constraint.table_name,
      saved_constraint.constraint_name
    );
  end loop;
end $$;

do $$
declare
  target_table text;
  column_type text;
begin
  foreach target_table in array array[
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

      if column_type = 'uuid' then
        execute format(
          'alter table public.%I alter column created_by set default auth.uid()',
          target_table
        );
      else
        execute format(
          'alter table public.%I alter column created_by set default auth.uid()::text',
          target_table
        );
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
  column_default text;
begin
  for target_table, target_column in
    select table_name, column_name
    from legacy_transaction_target_columns
    order by sort_order
  loop
    select data_type, column_default
    into column_type, column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = target_table
      and column_name = target_column;

    if column_type is null or column_type in ('text', 'character varying', 'uuid') then
      continue;
    end if;

    if column_default is not null then
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
declare
  saved_constraint record;
begin
  for saved_constraint in
    select add_statement
    from legacy_transaction_fk_constraints
    order by schema_name, table_name, constraint_name
  loop
    execute saved_constraint.add_statement;
  end loop;
end $$;

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

notify pgrst, 'reload schema';

commit;
