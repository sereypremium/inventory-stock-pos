import type {
  InventoryState,
  PurchaseHeader,
  PurchaseItem,
  StateOperationResult,
  StockInInput,
  StockMovement,
} from '../types/models';
import { build_failure, build_success, create_timestamps, next_reference_number } from './serviceHelpers';

export interface PurchaseDetailItem extends PurchaseItem {
  model_name: string;
  sku: string;
  size: string;
  color: string;
}

export interface PurchaseDetailView {
  header: PurchaseHeader;
  supplier_name: string;
  created_by_name: string;
  items: PurchaseDetailItem[];
}

function validate_stock_in_input(state: InventoryState, input: StockInInput) {
  if (!input.supplier_id) {
    return 'Supplier is required.';
  }

  if (!input.purchase_date) {
    return 'Purchase date is required.';
  }

  if (input.items.length === 0) {
    return 'Cannot save stock in with no items.';
  }

  const duplicate_variant_ids = new Set<string>();

  for (const item of input.items) {
    if (!item.product_variant_id) {
      return 'Each row must have a selected variant.';
    }

    if (duplicate_variant_ids.has(item.product_variant_id)) {
      return 'The same variant cannot be entered twice in one stock-in document.';
    }

    duplicate_variant_ids.add(item.product_variant_id);

    if (Number(item.qty) <= 0) {
      return 'Quantity must be greater than zero.';
    }

    if (Number(item.cost_price) < 0) {
      return 'Cost price must be greater than or equal to zero.';
    }

    const variant = state.product_variants.find(
      (product_variant) => product_variant.id === item.product_variant_id,
    );

    if (!variant) {
      return 'One or more selected variants could not be found.';
    }
  }

  return null;
}

export function create_purchase_transaction(
  state: InventoryState,
  input: StockInInput,
): StateOperationResult {
  const validation_message = validate_stock_in_input(state, input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const purchase_id = crypto.randomUUID();
  const purchase_no = next_reference_number(
    state.purchase_headers.map((purchase) => purchase.purchase_no),
    'PO',
  );
  const created_at = new Date(input.purchase_date).toISOString();
  let next_variants = [...state.product_variants];

  const purchase_items: PurchaseItem[] = [];
  const stock_movements: StockMovement[] = [];

  for (const item of input.items) {
    const variant_index = next_variants.findIndex(
      (product_variant) => product_variant.id === item.product_variant_id,
    );
    const variant = next_variants[variant_index];
    const next_stock_qty = variant.stock_qty + Number(item.qty);

    next_variants[variant_index] = {
      ...variant,
      cost_price: Number(item.cost_price),
      stock_qty: next_stock_qty,
      updated_at: created_at,
    };

    purchase_items.push({
      id: crypto.randomUUID(),
      purchase_id,
      product_variant_id: item.product_variant_id,
      qty: Number(item.qty),
      cost_price: Number(item.cost_price),
      line_total: Number(item.qty) * Number(item.cost_price),
      created_at,
    });

    stock_movements.push({
      id: crypto.randomUUID(),
      movement_date: created_at,
      product_variant_id: item.product_variant_id,
      movement_type: 'stock_in',
      reference_type: 'purchase',
      reference_id: purchase_id,
      qty_in: Number(item.qty),
      qty_out: 0,
      balance_after: next_stock_qty,
      notes: input.notes.trim() || 'Stock in transaction',
      created_by: input.created_by,
      created_at,
    });
  }

  const total_qty = purchase_items.reduce((total, item) => total + item.qty, 0);
  const total_amount = purchase_items.reduce((total, item) => total + item.line_total, 0);

  const purchase_header: PurchaseHeader = {
    id: purchase_id,
    ...create_timestamps(created_at),
    purchase_no,
    supplier_id: input.supplier_id,
    purchase_date: created_at,
    total_qty,
    total_amount,
    notes: input.notes.trim(),
    created_by: input.created_by,
  };

  return build_success(
    'Stock in saved successfully.',
    {
      ...state,
      product_variants: next_variants,
      purchase_headers: [purchase_header, ...state.purchase_headers],
      purchase_items: [...purchase_items, ...state.purchase_items],
      stock_movements: [...stock_movements, ...state.stock_movements],
    },
    purchase_id,
  );
}

export function get_purchase_detail(
  state: InventoryState,
  purchase_id: string,
): PurchaseDetailView | null {
  const header = state.purchase_headers.find((purchase) => purchase.id === purchase_id);

  if (!header) {
    return null;
  }

  const supplier_name =
    state.suppliers.find((supplier) => supplier.id === header.supplier_id)?.name ?? '-';
  const created_by_name =
    state.profiles.find((profile) => profile.id === header.created_by)?.full_name ?? '-';

  const items = state.purchase_items
    .filter((item) => item.purchase_id === purchase_id)
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
        sku: variant?.sku ?? '-',
        size: variant?.size ?? '-',
        color: variant?.color ?? '-',
      };
    });

  return {
    header,
    supplier_name,
    created_by_name,
    items,
  };
}
