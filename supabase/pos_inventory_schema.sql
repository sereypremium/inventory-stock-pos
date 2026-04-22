create table if not exists public.products (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  name text not null,
  style_code text not null unique,
  image_url text,
  brand_id text not null,
  category_id text not null,
  target_group text not null check (target_group in ('men', 'women', 'unisex', 'kids')),
  base_price numeric(12, 2) not null default 0,
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive'))
);

create table if not exists public.product_variants (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  -- Legacy deployments may still use bigint primary keys, so cross-table FKs are
  -- enforced in the app/service layer instead of this upgrade-safe migration.
  product_id text not null,
  sku text not null unique,
  barcode text,
  size text not null,
  color text not null,
  selling_price numeric(12, 2) not null default 0,
  cost_price numeric(12, 2) not null default 0,
  stock_qty integer not null default 0,
  min_stock integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  constraint product_variants_product_size_color_unique unique (product_id, size, color)
);

create table if not exists public.suppliers (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  name text not null,
  code text not null,
  contact_person text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive'))
);

create table if not exists public.purchase_headers (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  reference_no text not null,
  supplier_id text not null,
  supplier_name text not null,
  received_date date not null,
  received_by text not null,
  note text not null default '',
  total_items integer not null default 0,
  total_quantity integer not null default 0,
  total_cost numeric(12, 2) not null default 0
);

create table if not exists public.purchase_items (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  purchase_id text not null,
  product_id text not null,
  variant_id text not null,
  product_name text not null,
  variant_sku text not null,
  size text not null,
  color text not null,
  quantity integer not null default 0,
  unit_cost numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0
);

create table if not exists public.sale_headers (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  receipt_no text not null unique,
  sold_at timestamptz not null,
  cashier_id text not null,
  cashier_name text not null,
  customer_name text,
  payment_method text not null check (payment_method in ('cash', 'card', 'transfer')),
  discount_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  change_amount numeric(12, 2) not null default 0,
  note text not null default '',
  total_items integer not null default 0,
  total_quantity integer not null default 0,
  subtotal numeric(12, 2) not null default 0
);

create table if not exists public.sale_items (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  sale_id text not null,
  product_id text not null,
  variant_id text not null,
  product_name text not null,
  variant_sku text not null,
  size text not null,
  color text not null,
  quantity integer not null default 0,
  unit_price numeric(12, 2) not null default 0,
  unit_cost numeric(12, 2) not null default 0,
  line_cost numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  line_profit numeric(12, 2) not null default 0
);

alter table if exists public.products add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table if exists public.products add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table if exists public.products add column if not exists name text not null default '';
alter table if exists public.products add column if not exists style_code text not null default '';
alter table if exists public.products add column if not exists image_url text;
alter table if exists public.products add column if not exists brand_id text not null default '';
alter table if exists public.products add column if not exists category_id text not null default '';
alter table if exists public.products add column if not exists target_group text not null default 'unisex';
alter table if exists public.products add column if not exists base_price numeric(12, 2) not null default 0;
alter table if exists public.products add column if not exists description text not null default '';
alter table if exists public.products add column if not exists status text not null default 'active';

alter table if exists public.product_variants add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table if exists public.product_variants add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table if exists public.product_variants add column if not exists product_id text;
alter table if exists public.product_variants add column if not exists sku text not null default '';
alter table if exists public.product_variants add column if not exists barcode text;
alter table if exists public.product_variants add column if not exists size text not null default '';
alter table if exists public.product_variants add column if not exists color text not null default '';
alter table if exists public.product_variants add column if not exists selling_price numeric(12, 2) not null default 0;
alter table if exists public.product_variants add column if not exists cost_price numeric(12, 2) not null default 0;
alter table if exists public.product_variants add column if not exists stock_qty integer not null default 0;
alter table if exists public.product_variants add column if not exists min_stock integer not null default 0;
alter table if exists public.product_variants add column if not exists status text not null default 'active';

alter table if exists public.suppliers add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table if exists public.suppliers add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table if exists public.suppliers add column if not exists name text not null default '';
alter table if exists public.suppliers add column if not exists code text not null default '';
alter table if exists public.suppliers add column if not exists contact_person text not null default '';
alter table if exists public.suppliers add column if not exists phone text not null default '';
alter table if exists public.suppliers add column if not exists email text not null default '';
alter table if exists public.suppliers add column if not exists address text not null default '';
alter table if exists public.suppliers add column if not exists status text not null default 'active';

alter table if exists public.purchase_headers add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table if exists public.purchase_headers add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table if exists public.purchase_headers add column if not exists reference_no text not null default '';
alter table if exists public.purchase_headers add column if not exists supplier_id text;
alter table if exists public.purchase_headers add column if not exists supplier_name text not null default '';
alter table if exists public.purchase_headers add column if not exists received_date date not null default current_date;
alter table if exists public.purchase_headers add column if not exists received_by text not null default '';
alter table if exists public.purchase_headers add column if not exists note text not null default '';
alter table if exists public.purchase_headers add column if not exists total_items integer not null default 0;
alter table if exists public.purchase_headers add column if not exists total_quantity integer not null default 0;
alter table if exists public.purchase_headers add column if not exists total_cost numeric(12, 2) not null default 0;

alter table if exists public.purchase_items add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table if exists public.purchase_items add column if not exists purchase_id text;
alter table if exists public.purchase_items add column if not exists product_id text;
alter table if exists public.purchase_items add column if not exists variant_id text;
alter table if exists public.purchase_items add column if not exists product_name text not null default '';
alter table if exists public.purchase_items add column if not exists variant_sku text not null default '';
alter table if exists public.purchase_items add column if not exists size text not null default '';
alter table if exists public.purchase_items add column if not exists color text not null default '';
alter table if exists public.purchase_items add column if not exists quantity integer not null default 0;
alter table if exists public.purchase_items add column if not exists unit_cost numeric(12, 2) not null default 0;
alter table if exists public.purchase_items add column if not exists line_total numeric(12, 2) not null default 0;

alter table if exists public.sale_headers add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table if exists public.sale_headers add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table if exists public.sale_headers add column if not exists receipt_no text not null default '';
alter table if exists public.sale_headers add column if not exists sold_at timestamptz not null default timezone('utc', now());
alter table if exists public.sale_headers add column if not exists cashier_id text not null default '';
alter table if exists public.sale_headers add column if not exists cashier_name text not null default '';
alter table if exists public.sale_headers add column if not exists customer_name text;
alter table if exists public.sale_headers add column if not exists payment_method text not null default 'cash';
alter table if exists public.sale_headers add column if not exists discount_amount numeric(12, 2) not null default 0;
alter table if exists public.sale_headers add column if not exists total_amount numeric(12, 2) not null default 0;
alter table if exists public.sale_headers add column if not exists paid_amount numeric(12, 2) not null default 0;
alter table if exists public.sale_headers add column if not exists change_amount numeric(12, 2) not null default 0;
alter table if exists public.sale_headers add column if not exists note text not null default '';
alter table if exists public.sale_headers add column if not exists total_items integer not null default 0;
alter table if exists public.sale_headers add column if not exists total_quantity integer not null default 0;
alter table if exists public.sale_headers add column if not exists subtotal numeric(12, 2) not null default 0;

alter table if exists public.sale_items add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table if exists public.sale_items add column if not exists sale_id text;
alter table if exists public.sale_items add column if not exists product_id text;
alter table if exists public.sale_items add column if not exists variant_id text;
alter table if exists public.sale_items add column if not exists product_name text not null default '';
alter table if exists public.sale_items add column if not exists variant_sku text not null default '';
alter table if exists public.sale_items add column if not exists size text not null default '';
alter table if exists public.sale_items add column if not exists color text not null default '';
alter table if exists public.sale_items add column if not exists quantity integer not null default 0;
alter table if exists public.sale_items add column if not exists unit_price numeric(12, 2) not null default 0;
alter table if exists public.sale_items add column if not exists unit_cost numeric(12, 2) not null default 0;
alter table if exists public.sale_items add column if not exists line_cost numeric(12, 2) not null default 0;
alter table if exists public.sale_items add column if not exists line_total numeric(12, 2) not null default 0;
alter table if exists public.sale_items add column if not exists line_profit numeric(12, 2) not null default 0;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'product_code'
  ) then
    execute '
      update public.products
      set style_code = coalesce(nullif(style_code::text, ''''), product_code::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'model_name'
  ) then
    execute '
      update public.products
      set name = coalesce(nullif(name::text, ''''), model_name::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'gender'
  ) then
    execute '
      update public.products
      set target_group = coalesce(nullif(target_group::text, ''''), gender::text, ''unisex'')
    ';
  end if;
end $$;

do $$
begin
  update public.suppliers
  set code = upper(
    left(regexp_replace(coalesce(name::text, 'SUPPLIER'), '[^A-Za-z0-9]+', '', 'g'), 5) ||
    right(regexp_replace(coalesce(id::text, 'SUP'), '[^A-Za-z0-9]+', '', 'g'), 3)
  )
  where coalesce(nullif(code::text, ''), '') = '';
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_headers' and column_name = 'purchase_no'
  ) then
    execute '
      update public.purchase_headers
      set reference_no = coalesce(nullif(reference_no::text, ''''), purchase_no::text)
    ';
  end if;

  update public.purchase_headers
  set reference_no = coalesce(
    nullif(reference_no::text, ''),
    'PO-' || upper(right(regexp_replace(coalesce(id::text, 'PO'), '[^A-Za-z0-9]+', '', 'g'), 8))
  )
  where coalesce(nullif(reference_no::text, ''), '') = '';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_headers' and column_name = 'purchase_date'
  ) then
    execute '
      update public.purchase_headers
      set received_date = coalesce(purchase_date::date, received_date)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_headers' and column_name = 'created_by'
  ) then
    execute '
      update public.purchase_headers
      set received_by = coalesce(nullif(received_by::text, ''''), created_by::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_headers' and column_name = 'notes'
  ) then
    execute '
      update public.purchase_headers
      set note = coalesce(nullif(note::text, ''''), notes::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_headers' and column_name = 'total_qty'
  ) then
    execute '
      update public.purchase_headers
      set total_quantity = case
        when coalesce(total_quantity, 0) = 0 then coalesce(total_qty, 0)
        else total_quantity
      end
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_headers' and column_name = 'total_amount'
  ) then
    execute '
      update public.purchase_headers
      set total_cost = case
        when coalesce(total_cost, 0) = 0 then coalesce(total_amount, 0)
        else total_cost
      end
    ';
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'suppliers'
  ) then
    execute '
      update public.purchase_headers ph
      set supplier_name = coalesce(nullif(ph.supplier_name::text, ''''), s.name::text)
      from public.suppliers s
      where s.id::text = ph.supplier_id::text
    ';
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_headers' and column_name = 'created_by'
  ) then
    execute '
      update public.purchase_headers ph
      set received_by = coalesce(nullif(ph.received_by::text, ''''), p.full_name::text, ph.created_by::text)
      from public.profiles p
      where p.id::text = ph.created_by::text
    ';
  end if;

  update public.purchase_headers
  set supplier_name = coalesce(nullif(supplier_name::text, ''), supplier_id::text, 'Unknown Supplier');

  update public.purchase_headers
  set received_by = coalesce(nullif(received_by::text, ''), 'Store Admin');
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_items' and column_name = 'product_variant_id'
  ) then
    execute '
      update public.purchase_items
      set variant_id = coalesce(nullif(variant_id::text, ''''), product_variant_id::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_items' and column_name = 'qty'
  ) then
    execute '
      update public.purchase_items
      set quantity = case
        when coalesce(quantity, 0) = 0 then coalesce(qty, 0)
        else quantity
      end
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'purchase_items' and column_name = 'cost_price'
  ) then
    execute '
      update public.purchase_items
      set unit_cost = case
        when coalesce(unit_cost, 0) = 0 then coalesce(cost_price, 0)
        else unit_cost
      end
    ';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'product_variants' and column_name = 'sale_price'
  ) then
    execute '
      update public.product_variants
      set selling_price = case
        when coalesce(selling_price, 0) = 0 then coalesce(sale_price, 0)
        else selling_price
      end
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'product_variants' and column_name = 'min_stock_qty'
  ) then
    execute '
      update public.product_variants
      set min_stock = case
        when coalesce(min_stock, 0) = 0 then coalesce(min_stock_qty, 0)
        else min_stock
      end
    ';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_headers' and column_name = 'sale_no'
  ) then
    execute '
      update public.sale_headers
      set receipt_no = coalesce(nullif(receipt_no::text, ''''), sale_no::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_headers' and column_name = 'sale_date'
  ) then
    execute '
      update public.sale_headers
      set sold_at = coalesce(sale_date, sold_at)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_headers' and column_name = 'created_by'
  ) then
    execute '
      update public.sale_headers
      set cashier_id = coalesce(nullif(cashier_id::text, ''''), created_by::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_headers' and column_name = 'notes'
  ) then
    execute '
      update public.sale_headers
      set note = coalesce(nullif(note::text, ''''), notes::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'customers'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_headers' and column_name = 'customer_id'
  ) then
    execute '
      update public.sale_headers sh
      set customer_name = coalesce(nullif(sh.customer_name::text, ''''), c.name::text)
      from public.customers c
      where c.id::text = sh.customer_id::text
    ';
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    execute '
      update public.sale_headers sh
      set cashier_name = coalesce(nullif(sh.cashier_name::text, ''''), p.full_name::text, sh.cashier_id::text)
      from public.profiles p
      where p.id::text = sh.cashier_id::text
    ';
  end if;

  update public.sale_headers
  set cashier_name = coalesce(nullif(cashier_name, ''), cashier_id, 'Store Admin');

  update public.sale_headers
  set payment_method = 'transfer'
  where payment_method = 'e_wallet';
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_items' and column_name = 'product_variant_id'
  ) then
    execute '
      update public.sale_items
      set variant_id = coalesce(nullif(variant_id::text, ''''), product_variant_id::text)
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_items' and column_name = 'qty'
  ) then
    execute '
      update public.sale_items
      set quantity = case
        when coalesce(quantity, 0) = 0 then coalesce(qty, 0)
        else quantity
      end
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_items' and column_name = 'sale_price'
  ) then
    execute '
      update public.sale_items
      set unit_price = case
        when coalesce(unit_price, 0) = 0 then coalesce(sale_price, 0)
        else unit_price
      end
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_items' and column_name = 'cost_price'
  ) then
    execute '
      update public.sale_items
      set unit_cost = case
        when coalesce(unit_cost, 0) = 0 then coalesce(cost_price, 0)
        else unit_cost
      end
    ';
  end if;
end $$;

do $$
begin
  update public.purchase_items pi
  set
    product_id = coalesce(nullif(pi.product_id::text, ''), pv.product_id::text),
    variant_sku = coalesce(nullif(pi.variant_sku::text, ''), pv.sku::text),
    size = coalesce(nullif(pi.size::text, ''), pv.size::text),
    color = coalesce(nullif(pi.color::text, ''), pv.color::text),
    unit_cost = coalesce(nullif(pi.unit_cost, 0), pv.cost_price, 0),
    line_total = case
      when coalesce(pi.line_total, 0) = 0 then coalesce(pi.quantity, 0) * coalesce(nullif(pi.unit_cost, 0), pv.cost_price, 0)
      else pi.line_total
    end
  from public.product_variants pv
  where pv.id::text = pi.variant_id::text;

  update public.purchase_items pi
  set product_name = coalesce(nullif(pi.product_name::text, ''), p.name::text)
  from public.products p
  where p.id::text = pi.product_id::text;
end $$;

do $$
begin
  update public.purchase_headers ph
  set
    total_items = item_totals.total_items,
    total_quantity = case
      when coalesce(ph.total_quantity, 0) = 0 then item_totals.total_quantity
      else ph.total_quantity
    end,
    total_cost = case
      when coalesce(ph.total_cost, 0) = 0 then item_totals.total_cost
      else ph.total_cost
    end
  from (
    select purchase_id::text as purchase_id, count(*) as total_items, coalesce(sum(quantity), 0) as total_quantity, coalesce(sum(line_total), 0) as total_cost
    from public.purchase_items
    group by purchase_id::text
  ) item_totals
  where ph.id::text = item_totals.purchase_id;
end $$;

do $$
begin
  update public.products p
  set base_price = coalesce(price_map.min_price, p.base_price)
  from (
    select product_id::text as product_id, min(selling_price) as min_price
    from public.product_variants
    group by product_id::text
  ) price_map
  where p.id::text = price_map.product_id
    and coalesce(p.base_price, 0) = 0;
end $$;

do $$
begin
  update public.sale_items si
  set
    product_id = coalesce(nullif(si.product_id::text, ''), pv.product_id::text),
    variant_sku = coalesce(nullif(si.variant_sku::text, ''), pv.sku::text),
    size = coalesce(nullif(si.size::text, ''), pv.size::text),
    color = coalesce(nullif(si.color::text, ''), pv.color::text),
    unit_cost = coalesce(nullif(si.unit_cost, 0), pv.cost_price, 0),
    unit_price = coalesce(nullif(si.unit_price, 0), pv.selling_price, 0),
    line_cost = case
      when coalesce(si.line_cost, 0) = 0 then coalesce(si.quantity, 0) * coalesce(nullif(si.unit_cost, 0), pv.cost_price, 0)
      else si.line_cost
    end,
    line_profit = case
      when coalesce(si.line_profit, 0) = 0 then
        coalesce(si.line_total, 0) - (
          case
            when coalesce(si.line_cost, 0) = 0 then coalesce(si.quantity, 0) * coalesce(nullif(si.unit_cost, 0), pv.cost_price, 0)
            else si.line_cost
          end
        )
      else si.line_profit
    end
  from public.product_variants pv
  where pv.id::text = si.variant_id::text;

  update public.sale_items si
  set product_name = coalesce(nullif(si.product_name::text, ''), p.name::text)
  from public.products p
  where p.id::text = si.product_id::text;
end $$;

do $$
begin
  update public.sale_headers sh
  set
    total_items = item_totals.total_items,
    total_quantity = item_totals.total_quantity,
    subtotal = case
      when coalesce(sh.subtotal, 0) = 0 then item_totals.subtotal
      else sh.subtotal
    end
  from (
    select sale_id::text as sale_id, count(*) as total_items, coalesce(sum(quantity), 0) as total_quantity, coalesce(sum(line_total), 0) as subtotal
    from public.sale_items
    group by sale_id::text
  ) item_totals
  where sh.id::text = item_totals.sale_id;
end $$;

create index if not exists products_style_code_idx on public.products(style_code);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_barcode_idx on public.product_variants(barcode);
create unique index if not exists suppliers_code_idx on public.suppliers(code);
create index if not exists purchase_headers_reference_no_idx on public.purchase_headers(reference_no);
create index if not exists purchase_headers_supplier_id_idx on public.purchase_headers(supplier_id);
create index if not exists purchase_headers_received_date_idx on public.purchase_headers(received_date desc);
create index if not exists purchase_items_purchase_id_idx on public.purchase_items(purchase_id);
create index if not exists purchase_items_variant_id_idx on public.purchase_items(variant_id);
create index if not exists sale_headers_receipt_no_idx on public.sale_headers(receipt_no);
create index if not exists sale_headers_sold_at_idx on public.sale_headers(sold_at desc);
create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists sale_items_variant_id_idx on public.sale_items(variant_id);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_headers enable row level security;
alter table public.purchase_items enable row level security;
alter table public.sale_headers enable row level security;
alter table public.sale_items enable row level security;

drop policy if exists "products_dev_all" on public.products;
drop policy if exists "product_variants_dev_all" on public.product_variants;
drop policy if exists "suppliers_dev_all" on public.suppliers;
drop policy if exists "purchase_headers_dev_all" on public.purchase_headers;
drop policy if exists "purchase_items_dev_all" on public.purchase_items;
drop policy if exists "sale_headers_dev_all" on public.sale_headers;
drop policy if exists "sale_items_dev_all" on public.sale_items;

create policy "products_dev_all"
on public.products
for all
to anon, authenticated
using (true)
with check (true);

create policy "product_variants_dev_all"
on public.product_variants
for all
to anon, authenticated
using (true)
with check (true);

create policy "suppliers_dev_all"
on public.suppliers
for all
to anon, authenticated
using (true)
with check (true);

create policy "purchase_headers_dev_all"
on public.purchase_headers
for all
to anon, authenticated
using (true)
with check (true);

create policy "purchase_items_dev_all"
on public.purchase_items
for all
to anon, authenticated
using (true)
with check (true);

create policy "sale_headers_dev_all"
on public.sale_headers
for all
to anon, authenticated
using (true)
with check (true);

create policy "sale_items_dev_all"
on public.sale_items
for all
to anon, authenticated
using (true)
with check (true);
