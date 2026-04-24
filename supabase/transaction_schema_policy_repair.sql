-- Run this on projects that already have auth/RLS enabled but still fail stock-in or sales
-- with "created_by" schema cache errors. It is safe to rerun.

begin;

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
