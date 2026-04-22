import type {
  InventoryState,
  ProductVariant,
  SaleHeader,
  SaleInput,
  SaleItem,
  StateOperationResult,
  StockMovement,
} from '../types/models';
import { build_failure, build_success, create_timestamps, next_reference_number } from './serviceHelpers';

export interface PosVariantSearchItem {
  id: string;
  product_id: string;
  product_code: string;
  model_name: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  sale_price: number;
  cost_price: number;
  stock_qty: number;
  min_stock_qty: number;
  status: ProductVariant['status'];
  brand_name: string;
  category_name: string;
}

export interface SaleDetailItem extends SaleItem {
  model_name: string;
  product_code: string;
  sku: string;
  size: string;
  color: string;
}

export interface SaleDetailView {
  header: SaleHeader;
  customer_name: string | null;
  cashier_name: string;
  items: SaleDetailItem[];
}

function validate_sale_input(state: InventoryState, input: SaleInput) {
  if (!input.sale_date) {
    return 'Sale date is required.';
  }

  if (input.items.length === 0) {
    return 'Cannot save sale with empty cart.';
  }

  const duplicate_variant_ids = new Set<string>();
  let subtotal = 0;
  let item_discount_total = 0;

  for (const item of input.items) {
    if (!item.product_variant_id) {
      return 'Each cart line must have a variant.';
    }

    if (duplicate_variant_ids.has(item.product_variant_id)) {
      return 'The same variant cannot appear twice in the sale.';
    }

    duplicate_variant_ids.add(item.product_variant_id);

    if (Number(item.qty) <= 0) {
      return 'Quantity must be greater than zero.';
    }

    if (Number(item.sale_price) < 0) {
      return 'Sale price must be greater than or equal to zero.';
    }

    if (Number(item.discount_amount) < 0) {
      return 'Line discount cannot be negative.';
    }

    const variant = state.product_variants.find(
      (product_variant) => product_variant.id === item.product_variant_id,
    );

    if (!variant) {
      return 'One or more cart variants could not be found.';
    }

    if (Number(item.qty) > variant.stock_qty) {
      return `Cannot sell above available stock for ${variant.sku}.`;
    }

    subtotal += Number(item.qty) * Number(item.sale_price);
    item_discount_total += Number(item.discount_amount);
  }

  if (Number(input.discount_amount) < 0) {
    return 'Discount amount cannot be negative.';
  }

  const total_amount = subtotal - item_discount_total - Number(input.discount_amount);

  if (total_amount < 0) {
    return 'Discount is too large for the current cart.';
  }

  if (Number(input.paid_amount) < total_amount) {
    return 'Paid amount must be enough.';
  }

  return null;
}

export function search_pos_variants(state: InventoryState, search_query: string) {
  return filter_pos_variants(state, search_query, 'all');
}

export function filter_pos_variants(
  state: InventoryState,
  search_query: string,
  category_id: string,
) {
  const brand_map = Object.fromEntries(state.brands.map((brand) => [brand.id, brand.name]));
  const category_map = Object.fromEntries(
    state.categories.map((category) => [category.id, category.name]),
  );
  const normalized_query = search_query.trim().toLowerCase();

  const results = state.product_variants
    .map((variant) => {
      const product = state.products.find((catalog_product) => catalog_product.id === variant.product_id);

      if (!product || product.status !== 'active' || variant.status !== 'active') {
        return null;
      }

      const result: PosVariantSearchItem = {
        id: variant.id,
        product_id: product.id,
        product_code: product.product_code,
        model_name: product.model_name,
        sku: variant.sku,
        barcode: variant.barcode,
        size: variant.size,
        color: variant.color,
        sale_price: variant.sale_price,
        cost_price: variant.cost_price,
        stock_qty: variant.stock_qty,
        min_stock_qty: variant.min_stock_qty,
        status: variant.status,
        brand_name: brand_map[product.brand_id] ?? '-',
        category_name: category_map[product.category_id] ?? '-',
      };

      if (!normalized_query) {
        return category_id === 'all' || product.category_id === category_id ? result : null;
      }

      const haystack = [
        result.model_name,
        result.product_code,
        result.sku,
        result.barcode,
        result.size,
        result.color,
        result.brand_name,
        result.category_name,
      ]
        .join(' ')
        .toLowerCase();

      const matches_query = haystack.includes(normalized_query);
      const matches_category = category_id === 'all' || product.category_id === category_id;

      return matches_query && matches_category ? result : null;
    })
    .filter((result): result is PosVariantSearchItem => Boolean(result))
    .sort((left, right) => {
      if (left.stock_qty === 0 && right.stock_qty > 0) {
        return 1;
      }

      if (right.stock_qty === 0 && left.stock_qty > 0) {
        return -1;
      }

      return left.model_name.localeCompare(right.model_name);
    });

  return normalized_query ? results : results.slice(0, 12);
}

export function create_sale_transaction(
  state: InventoryState,
  input: SaleInput,
): StateOperationResult {
  const validation_message = validate_sale_input(state, input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const sale_id = crypto.randomUUID();
  const sale_no = next_reference_number(state.sale_headers.map((sale) => sale.sale_no), 'SL');
  const created_at = new Date(input.sale_date).toISOString();
  let next_variants = [...state.product_variants];

  const sale_items: SaleItem[] = [];
  const stock_movements: StockMovement[] = [];

  let subtotal = 0;
  let item_discount_total = 0;

  for (const item of input.items) {
    const variant_index = next_variants.findIndex(
      (product_variant) => product_variant.id === item.product_variant_id,
    );
    const variant = next_variants[variant_index];
    const gross_line_total = Number(item.qty) * Number(item.sale_price);
    const line_discount = Number(item.discount_amount);
    const line_total = gross_line_total - line_discount;
    const next_stock_qty = variant.stock_qty - Number(item.qty);

    subtotal += gross_line_total;
    item_discount_total += line_discount;

    next_variants[variant_index] = {
      ...variant,
      stock_qty: next_stock_qty,
      updated_at: created_at,
    };

    sale_items.push({
      id: crypto.randomUUID(),
      sale_id,
      product_variant_id: item.product_variant_id,
      qty: Number(item.qty),
      cost_price: variant.cost_price,
      sale_price: Number(item.sale_price),
      discount_amount: line_discount,
      line_total,
      created_at,
    });

    stock_movements.push({
      id: crypto.randomUUID(),
      movement_date: created_at,
      product_variant_id: item.product_variant_id,
      movement_type: 'sale',
      reference_type: 'sale',
      reference_id: sale_id,
      qty_in: 0,
      qty_out: Number(item.qty),
      balance_after: next_stock_qty,
      notes: input.notes.trim() || 'POS sale transaction',
      created_by: input.created_by,
      created_at,
    });
  }

  const total_discount = item_discount_total + Number(input.discount_amount);
  const total_amount = subtotal - total_discount;

  const sale_header: SaleHeader = {
    id: sale_id,
    ...create_timestamps(created_at),
    sale_no,
    sale_date: created_at,
    customer_id: input.customer_id,
    subtotal,
    discount_amount: total_discount,
    total_amount,
    paid_amount: Number(input.paid_amount),
    change_amount: Number(input.paid_amount) - total_amount,
    payment_method: input.payment_method,
    notes: input.notes.trim(),
    created_by: input.created_by,
  };

  return build_success(
    'Sale completed successfully.',
    {
      ...state,
      product_variants: next_variants,
      sale_headers: [sale_header, ...state.sale_headers],
      sale_items: [...sale_items, ...state.sale_items],
      stock_movements: [...stock_movements, ...state.stock_movements],
    },
    sale_id,
  );
}

export function get_sale_detail(state: InventoryState, sale_id: string): SaleDetailView | null {
  const header = state.sale_headers.find((sale) => sale.id === sale_id);

  if (!header) {
    return null;
  }

  const customer_name =
    state.customers.find((customer) => customer.id === header.customer_id)?.name ?? null;
  const cashier_name =
    state.profiles.find((profile) => profile.id === header.created_by)?.full_name ?? '-';

  const items = state.sale_items
    .filter((item) => item.sale_id === sale_id)
    .map((item) => {
      const variant = state.product_variants.find(
        (product_variant) => product_variant.id === item.product_variant_id,
      );
      const product = state.products.find(
        (catalog_product) => catalog_product.id === variant?.product_id,
      );

      return {
        ...item,
        model_name: product?.model_name ?? 'Deleted product',
        product_code: product?.product_code ?? '-',
        sku: variant?.sku ?? '-',
        size: variant?.size ?? '-',
        color: variant?.color ?? '-',
      };
    });

  return {
    header,
    customer_name,
    cashier_name,
    items,
  };
}
