import type {
  InventoryState,
  Product,
  ProductInput,
  ProductVariant,
  ProductVariantInput,
  StateOperationResult,
} from '../types/models';
import { build_failure, build_success, create_timestamps } from './serviceHelpers';

function validate_product_input(state: InventoryState, input: ProductInput, product_id?: string) {
  if (!input.product_code.trim()) {
    return 'Product code is required.';
  }

  if (!input.brand_id) {
    return 'Brand is required.';
  }

  if (!input.category_id) {
    return 'Category is required.';
  }

  if (!input.model_name.trim()) {
    return 'Model name is required.';
  }

  const duplicate_product_code = state.products.some(
    (product) =>
      product.id !== product_id &&
      product.product_code.toLowerCase() === input.product_code.trim().toLowerCase(),
  );

  if (duplicate_product_code) {
    return 'Product code must be unique.';
  }

  return null;
}

function validate_variant_input(
  state: InventoryState,
  input: ProductVariantInput,
  variant_id?: string,
) {
  if (!input.product_id) {
    return 'Product is required for the variant.';
  }

  if (!input.sku.trim()) {
    return 'SKU is required.';
  }

  if (!input.size.trim()) {
    return 'Size is required.';
  }

  if (!input.color.trim()) {
    return 'Color is required.';
  }

  if (Number(input.sale_price) < 0) {
    return 'Sale price must be greater than or equal to zero.';
  }

  if (Number(input.stock_qty) < 0) {
    return 'Stock quantity cannot be negative.';
  }

  if (Number(input.min_stock_qty) < 0) {
    return 'Minimum stock quantity cannot be negative.';
  }

  const duplicate_sku = state.product_variants.some(
    (variant) =>
      variant.id !== variant_id && variant.sku.toLowerCase() === input.sku.trim().toLowerCase(),
  );

  if (duplicate_sku) {
    return 'SKU must be unique.';
  }

  const duplicate_variant = state.product_variants.some(
    (variant) =>
      variant.id !== variant_id &&
      variant.product_id === input.product_id &&
      variant.size.trim() === input.size.trim() &&
      variant.color.toLowerCase() === input.color.trim().toLowerCase(),
  );

  if (duplicate_variant) {
    return 'This size and color combination already exists for the selected product.';
  }

  return null;
}

export function create_product(state: InventoryState, input: ProductInput): StateOperationResult {
  const validation_message = validate_product_input(state, input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const next_product: Product = {
    id: crypto.randomUUID(),
    ...create_timestamps(),
    product_code: input.product_code.trim().toUpperCase(),
    brand_id: input.brand_id,
    category_id: input.category_id,
    model_name: input.model_name.trim(),
    gender: input.gender,
    description: input.description.trim(),
    image_url: input.image_url.trim(),
    status: input.status,
  };

  return build_success(
    'Product saved successfully.',
    { ...state, products: [next_product, ...state.products] },
    next_product.id,
  );
}

export function update_product(
  state: InventoryState,
  product_id: string,
  input: ProductInput,
): StateOperationResult {
  const validation_message = validate_product_input(state, input, product_id);

  if (validation_message) {
    return build_failure(validation_message);
  }

  return build_success('Product updated successfully.', {
    ...state,
    products: state.products.map((product) =>
      product.id === product_id
        ? {
            ...product,
            product_code: input.product_code.trim().toUpperCase(),
            brand_id: input.brand_id,
            category_id: input.category_id,
            model_name: input.model_name.trim(),
            gender: input.gender,
            description: input.description.trim(),
            image_url: input.image_url.trim(),
            status: input.status,
            updated_at: new Date().toISOString(),
          }
        : product,
    ),
  });
}

export function delete_product(state: InventoryState, product_id: string): StateOperationResult {
  const linked_variants = state.product_variants.filter(
    (variant) => variant.product_id === product_id,
  ).length;

  if (linked_variants > 0) {
    return build_failure(
      'This product still has variants. Delete the variants first to avoid orphan stock.',
    );
  }

  return build_success('Product deleted successfully.', {
    ...state,
    products: state.products.filter((product) => product.id !== product_id),
  });
}

export function create_product_variant(
  state: InventoryState,
  input: ProductVariantInput,
): StateOperationResult {
  const validation_message = validate_variant_input(state, input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const next_variant: ProductVariant = {
    id: crypto.randomUUID(),
    ...create_timestamps(),
    product_id: input.product_id,
    sku: input.sku.trim().toUpperCase(),
    barcode: input.barcode.trim(),
    size: input.size.trim(),
    color: input.color.trim(),
    cost_price: Number(input.cost_price),
    sale_price: Number(input.sale_price),
    stock_qty: Number(input.stock_qty),
    min_stock_qty: Number(input.min_stock_qty),
    status: input.status,
  };

  return build_success(
    'Product variant saved successfully.',
    { ...state, product_variants: [next_variant, ...state.product_variants] },
    next_variant.id,
  );
}

export function update_product_variant(
  state: InventoryState,
  variant_id: string,
  input: ProductVariantInput,
): StateOperationResult {
  const validation_message = validate_variant_input(state, input, variant_id);

  if (validation_message) {
    return build_failure(validation_message);
  }

  return build_success('Product variant updated successfully.', {
    ...state,
    product_variants: state.product_variants.map((variant) =>
      variant.id === variant_id
        ? {
            ...variant,
            product_id: input.product_id,
            sku: input.sku.trim().toUpperCase(),
            barcode: input.barcode.trim(),
            size: input.size.trim(),
            color: input.color.trim(),
            cost_price: Number(input.cost_price),
            sale_price: Number(input.sale_price),
            stock_qty: Number(input.stock_qty),
            min_stock_qty: Number(input.min_stock_qty),
            status: input.status,
            updated_at: new Date().toISOString(),
          }
        : variant,
    ),
  });
}

export function delete_product_variant(
  state: InventoryState,
  variant_id: string,
): StateOperationResult {
  const has_purchase_items = state.purchase_items.some(
    (item) => item.product_variant_id === variant_id,
  );
  const has_sale_items = state.sale_items.some((item) => item.product_variant_id === variant_id);

  if (has_purchase_items || has_sale_items) {
    return build_failure(
      'This variant has stock history. Deactivate it instead of deleting to keep records safe.',
    );
  }

  return build_success('Product variant deleted successfully.', {
    ...state,
    product_variants: state.product_variants.filter((variant) => variant.id !== variant_id),
  });
}
