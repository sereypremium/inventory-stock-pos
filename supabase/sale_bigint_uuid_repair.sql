-- Run this if sale confirmation fails with:
-- invalid input syntax for type bigint: "<uuid>"
-- It converts legacy numeric transaction identifier columns to text-compatible
-- columns so the app can save UUID-based session and transaction ids.

begin;

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

notify pgrst, 'reload schema';

commit;
