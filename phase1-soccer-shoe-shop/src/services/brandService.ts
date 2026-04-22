import type { Brand, BrandInput, InventoryState, StateOperationResult } from '../types/models';
import { build_failure, build_success, create_timestamps } from './serviceHelpers';

function validate_brand_input(input: BrandInput) {
  if (!input.name.trim()) {
    return 'Brand name is required.';
  }

  return null;
}

export function create_brand(state: InventoryState, input: BrandInput): StateOperationResult {
  const validation_message = validate_brand_input(input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const duplicate = state.brands.some(
    (brand) => brand.name.toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    return build_failure('Brand name already exists.');
  }

  const next_brand: Brand = {
    id: crypto.randomUUID(),
    ...create_timestamps(),
    name: input.name.trim(),
    description: input.description.trim(),
    status: input.status,
  };

  return build_success(
    'Brand saved successfully.',
    { ...state, brands: [next_brand, ...state.brands] },
    next_brand.id,
  );
}

export function update_brand(
  state: InventoryState,
  brand_id: string,
  input: BrandInput,
): StateOperationResult {
  const validation_message = validate_brand_input(input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const duplicate = state.brands.some(
    (brand) =>
      brand.id !== brand_id && brand.name.toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    return build_failure('Brand name already exists.');
  }

  return build_success('Brand updated successfully.', {
    ...state,
    brands: state.brands.map((brand) =>
      brand.id === brand_id
        ? {
            ...brand,
            name: input.name.trim(),
            description: input.description.trim(),
            status: input.status,
            updated_at: new Date().toISOString(),
          }
        : brand,
    ),
  });
}

export function delete_brand(state: InventoryState, brand_id: string): StateOperationResult {
  const linked_products = state.products.filter((product) => product.brand_id === brand_id).length;

  if (linked_products > 0) {
    return build_failure(
      'This brand is already assigned to products. Remove or reassign those products first.',
    );
  }

  return build_success('Brand deleted successfully.', {
    ...state,
    brands: state.brands.filter((brand) => brand.id !== brand_id),
  });
}
