import type { InventoryState } from '../types/models';

interface DashboardSalePreview {
  id: string;
  sale_no: string;
  sold_at: string;
  cashier_name: string;
  total_amount: number;
}

interface DashboardTopItem {
  id: string;
  model_name: string;
  variant_label: string;
  qty: number;
}

interface DashboardLowStockItem {
  id: string;
  model_name: string;
  sku: string;
  size: string;
  color: string;
  stock_qty: number;
  min_stock_qty: number;
}

export interface DashboardSnapshot {
  today_sales: number;
  today_profit: number;
  today_transactions: number;
  low_stock_count: number;
  recent_sales: DashboardSalePreview[];
  top_selling_items: DashboardTopItem[];
  low_stock_items: DashboardLowStockItem[];
}

function get_date_key(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function get_dashboard_snapshot(state: InventoryState): DashboardSnapshot {
  const today_key = get_date_key(new Date().toISOString());
  const product_map = Object.fromEntries(state.products.map((product) => [product.id, product]));
  const cashier_map = Object.fromEntries(state.profiles.map((profile) => [profile.id, profile.full_name]));

  const low_stock_items = state.product_variants
    .filter((variant) => variant.stock_qty <= variant.min_stock_qty)
    .map((variant) => ({
      id: variant.id,
      model_name: product_map[variant.product_id]?.model_name ?? 'Unknown product',
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stock_qty: variant.stock_qty,
      min_stock_qty: variant.min_stock_qty,
    }))
    .sort((left, right) => left.stock_qty - right.stock_qty);

  const today_sales = state.sale_headers.filter((sale) => get_date_key(sale.sale_date) === today_key);

  const recent_sales = [...state.sale_headers]
    .sort((left, right) => right.sale_date.localeCompare(left.sale_date))
    .slice(0, 5)
    .map((sale) => ({
      id: sale.id,
      sale_no: sale.sale_no,
      sold_at: sale.sale_date,
      cashier_name: cashier_map[sale.created_by] ?? '-',
      total_amount: sale.total_amount,
    }));

  const item_qty_map = new Map<string, DashboardTopItem>();

  for (const item of state.sale_items) {
    const variant = state.product_variants.find(
      (product_variant) => product_variant.id === item.product_variant_id,
    );
    const product = state.products.find(
      (catalog_product) => catalog_product.id === variant?.product_id,
    );

    if (!variant || !product) {
      continue;
    }

    const current = item_qty_map.get(item.product_variant_id) ?? {
      id: item.product_variant_id,
      model_name: product.model_name,
      variant_label: `${variant.size} / ${variant.color}`,
      qty: 0,
    };

    item_qty_map.set(item.product_variant_id, {
      ...current,
      qty: current.qty + item.qty,
    });
  }

  const today_profit = today_sales.reduce((total, sale) => {
    const sale_cost_total = state.sale_items
      .filter((item) => item.sale_id === sale.id)
      .reduce((cost_total, item) => cost_total + item.cost_price * item.qty, 0);

    return total + (sale.total_amount - sale_cost_total);
  }, 0);

  return {
    today_sales: today_sales.reduce((total, sale) => total + sale.total_amount, 0),
    today_profit,
    today_transactions: today_sales.length,
    low_stock_count: low_stock_items.length,
    recent_sales,
    top_selling_items: Array.from(item_qty_map.values())
      .sort((left, right) => right.qty - left.qty)
      .slice(0, 5),
    low_stock_items,
  };
}
