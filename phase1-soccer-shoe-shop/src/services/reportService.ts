import type { InventoryState } from '../types/models';

export interface DailySalesReportRow {
  sale_id: string;
  sale_no: string;
  sale_date: string;
  customer_name: string;
  cashier_name: string;
  qty: number;
  total_amount: number;
  profit_amount: number;
}

export interface MonthlySalesReportRow {
  day: string;
  transactions: number;
  total_amount: number;
  profit_amount: number;
}

export interface StockBalanceReportRow {
  variant_id: string;
  model_name: string;
  brand_name: string;
  category_name: string;
  sku: string;
  size: string;
  color: string;
  stock_qty: number;
  min_stock_qty: number;
  cost_price: number;
  sale_price: number;
  stock_value: number;
}

export interface BestSellingReportRow {
  variant_id: string;
  model_name: string;
  sku: string;
  size: string;
  color: string;
  qty: number;
  sales_amount: number;
}

export interface ProfitReportRow {
  sale_id: string;
  sale_no: string;
  sale_date: string;
  cashier_name: string;
  total_amount: number;
  cost_amount: number;
  profit_amount: number;
}

function get_date_key(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function get_month_key(value: string) {
  return get_date_key(value).slice(0, 7);
}

function is_between_dates(value: string, from_date?: string, to_date?: string) {
  const target = get_date_key(value);

  if (from_date && target < from_date) {
    return false;
  }

  if (to_date && target > to_date) {
    return false;
  }

  return true;
}

function get_sale_cost_total(state: InventoryState, sale_id: string) {
  return state.sale_items
    .filter((item) => item.sale_id === sale_id)
    .reduce((total, item) => total + item.cost_price * item.qty, 0);
}

function get_sale_qty_total(state: InventoryState, sale_id: string) {
  return state.sale_items
    .filter((item) => item.sale_id === sale_id)
    .reduce((total, item) => total + item.qty, 0);
}

export function get_daily_sales_report(state: InventoryState, selected_date: string) {
  return state.sale_headers
    .filter((sale) => get_date_key(sale.sale_date) === selected_date)
    .map((sale) => {
      const cost_total = get_sale_cost_total(state, sale.id);

      return {
        sale_id: sale.id,
        sale_no: sale.sale_no,
        sale_date: sale.sale_date,
        customer_name:
          state.customers.find((customer) => customer.id === sale.customer_id)?.name ?? 'Walk-in',
        cashier_name:
          state.profiles.find((profile) => profile.id === sale.created_by)?.full_name ?? '-',
        qty: get_sale_qty_total(state, sale.id),
        total_amount: sale.total_amount,
        profit_amount: sale.total_amount - cost_total,
      } satisfies DailySalesReportRow;
    })
    .sort((left, right) => right.sale_date.localeCompare(left.sale_date));
}

export function get_monthly_sales_report(state: InventoryState, selected_month: string) {
  const grouped = new Map<string, MonthlySalesReportRow>();

  for (const sale of state.sale_headers.filter(
    (entry) => get_month_key(entry.sale_date) === selected_month,
  )) {
    const day = get_date_key(sale.sale_date);
    const current = grouped.get(day) ?? {
      day,
      transactions: 0,
      total_amount: 0,
      profit_amount: 0,
    };
    const cost_total = get_sale_cost_total(state, sale.id);

    grouped.set(day, {
      day,
      transactions: current.transactions + 1,
      total_amount: current.total_amount + sale.total_amount,
      profit_amount: current.profit_amount + (sale.total_amount - cost_total),
    });
  }

  return Array.from(grouped.values()).sort((left, right) => left.day.localeCompare(right.day));
}

export function get_stock_balance_report(state: InventoryState) {
  const brand_map = Object.fromEntries(state.brands.map((brand) => [brand.id, brand.name]));
  const category_map = Object.fromEntries(
    state.categories.map((category) => [category.id, category.name]),
  );

  return state.product_variants
    .map((variant) => {
      const product = state.products.find((catalog_product) => catalog_product.id === variant.product_id);

      if (!product) {
        return null;
      }

      return {
        variant_id: variant.id,
        model_name: product.model_name,
        brand_name: brand_map[product.brand_id] ?? '-',
        category_name: category_map[product.category_id] ?? '-',
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        stock_qty: variant.stock_qty,
        min_stock_qty: variant.min_stock_qty,
        cost_price: variant.cost_price,
        sale_price: variant.sale_price,
        stock_value: variant.stock_qty * variant.cost_price,
      } satisfies StockBalanceReportRow;
    })
    .filter((row): row is StockBalanceReportRow => Boolean(row))
    .sort((left, right) => left.model_name.localeCompare(right.model_name));
}

export function get_low_stock_report(state: InventoryState) {
  return get_stock_balance_report(state).filter((row) => row.stock_qty <= row.min_stock_qty);
}

export function get_best_selling_report(
  state: InventoryState,
  from_date?: string,
  to_date?: string,
) {
  const grouped = new Map<string, BestSellingReportRow>();

  for (const item of state.sale_items) {
    const sale = state.sale_headers.find((header) => header.id === item.sale_id);

    if (!sale || !is_between_dates(sale.sale_date, from_date, to_date)) {
      continue;
    }

    const variant = state.product_variants.find(
      (product_variant) => product_variant.id === item.product_variant_id,
    );
    const product = state.products.find(
      (catalog_product) => catalog_product.id === variant?.product_id,
    );

    if (!variant || !product) {
      continue;
    }

    const current = grouped.get(item.product_variant_id) ?? {
      variant_id: item.product_variant_id,
      model_name: product.model_name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      qty: 0,
      sales_amount: 0,
    };

    grouped.set(item.product_variant_id, {
      ...current,
      qty: current.qty + item.qty,
      sales_amount: current.sales_amount + item.line_total,
    });
  }

  return Array.from(grouped.values()).sort((left, right) => right.qty - left.qty);
}

export function get_profit_report(
  state: InventoryState,
  from_date?: string,
  to_date?: string,
) {
  return state.sale_headers
    .filter((sale) => is_between_dates(sale.sale_date, from_date, to_date))
    .map((sale) => {
      const cost_amount = get_sale_cost_total(state, sale.id);

      return {
        sale_id: sale.id,
        sale_no: sale.sale_no,
        sale_date: sale.sale_date,
        cashier_name:
          state.profiles.find((profile) => profile.id === sale.created_by)?.full_name ?? '-',
        total_amount: sale.total_amount,
        cost_amount,
        profit_amount: sale.total_amount - cost_amount,
      } satisfies ProfitReportRow;
    })
    .sort((left, right) => right.sale_date.localeCompare(left.sale_date));
}
