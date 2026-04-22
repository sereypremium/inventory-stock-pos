import type {
  Category,
  CategoryInput,
  InventoryState,
  StateOperationResult,
} from '../types/models';
import { build_failure, build_success, create_timestamps } from './serviceHelpers';

function validate_category_input(input: CategoryInput) {
  if (!input.name.trim()) {
    return 'Category name is required.';
  }

  return null;
}

export function create_category(
  state: InventoryState,
  input: CategoryInput,
): StateOperationResult {
  const validation_message = validate_category_input(input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const duplicate = state.categories.some(
    (category) => category.name.toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    return build_failure('Category name already exists.');
  }

  const next_category: Category = {
    id: crypto.randomUUID(),
    ...create_timestamps(),
    name: input.name.trim(),
    description: input.description.trim(),
    status: input.status,
  };

  return build_success(
    'Category saved successfully.',
    { ...state, categories: [next_category, ...state.categories] },
    next_category.id,
  );
}

export function update_category(
  state: InventoryState,
  category_id: string,
  input: CategoryInput,
): StateOperationResult {
  const validation_message = validate_category_input(input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const duplicate = state.categories.some(
    (category) =>
      category.id !== category_id &&
      category.name.toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    return build_failure('Category name already exists.');
  }

  return build_success('Category updated successfully.', {
    ...state,
    categories: state.categories.map((category) =>
      category.id === category_id
        ? {
            ...category,
            name: input.name.trim(),
            description: input.description.trim(),
            status: input.status,
            updated_at: new Date().toISOString(),
          }
        : category,
    ),
  });
}

export function delete_category(
  state: InventoryState,
  category_id: string,
): StateOperationResult {
  const linked_products = state.products.filter(
    (product) => product.category_id === category_id,
  ).length;

  if (linked_products > 0) {
    return build_failure(
      'This category is already assigned to products. Remove or reassign those products first.',
    );
  }

  return build_success('Category deleted successfully.', {
    ...state,
    categories: state.categories.filter((category) => category.id !== category_id),
  });
}
