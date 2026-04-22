import { mock_inventory_state } from '../data/mockData';
import type { InventoryState } from '../types/models';

const CATALOG_STORAGE_KEY = 'soccer-shoe-shop-pos.catalog';

function clone_default_state() {
  return JSON.parse(JSON.stringify(mock_inventory_state)) as InventoryState;
}

function normalize_catalog_state(value: Partial<InventoryState>) {
  const defaults = clone_default_state();

  return {
    ...defaults,
    ...value,
    brands: Array.isArray(value.brands) ? value.brands : defaults.brands,
    categories: Array.isArray(value.categories) ? value.categories : defaults.categories,
    suppliers: Array.isArray(value.suppliers) ? value.suppliers : defaults.suppliers,
    customers: Array.isArray(value.customers) ? value.customers : defaults.customers,
    profiles: Array.isArray(value.profiles) ? value.profiles : defaults.profiles,
    products: Array.isArray(value.products) ? value.products : defaults.products,
    product_variants: Array.isArray(value.product_variants)
      ? value.product_variants
      : defaults.product_variants,
    purchase_headers: Array.isArray(value.purchase_headers)
      ? value.purchase_headers
      : defaults.purchase_headers,
    purchase_items: Array.isArray(value.purchase_items) ? value.purchase_items : defaults.purchase_items,
    sale_headers: Array.isArray(value.sale_headers) ? value.sale_headers : defaults.sale_headers,
    sale_items: Array.isArray(value.sale_items) ? value.sale_items : defaults.sale_items,
    stock_movements: Array.isArray(value.stock_movements)
      ? value.stock_movements
      : defaults.stock_movements,
    settings: {
      ...defaults.settings,
      ...(value.settings ?? {}),
    },
  } satisfies InventoryState;
}

export function load_catalog_state() {
  if (typeof window === 'undefined') {
    return clone_default_state();
  }

  const stored_value = localStorage.getItem(CATALOG_STORAGE_KEY);

  if (!stored_value) {
    return clone_default_state();
  }

  try {
    return normalize_catalog_state(JSON.parse(stored_value) as Partial<InventoryState>);
  } catch {
    localStorage.removeItem(CATALOG_STORAGE_KEY);
    return clone_default_state();
  }
}

export function save_catalog_state(state: InventoryState) {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(state));
}
