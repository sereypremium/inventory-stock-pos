import type {
  Customer,
  CustomerInput,
  InventoryState,
  StateOperationResult,
} from '../types/models';
import { build_failure, build_success, create_timestamps } from './serviceHelpers';

function validate_customer_input(input: CustomerInput) {
  if (!input.name.trim()) {
    return 'Customer name is required.';
  }

  return null;
}

export function create_customer(
  state: InventoryState,
  input: CustomerInput,
): StateOperationResult {
  const validation_message = validate_customer_input(input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const duplicate = state.customers.some(
    (customer) => customer.name.toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    return build_failure('Customer name already exists.');
  }

  const next_customer: Customer = {
    id: crypto.randomUUID(),
    ...create_timestamps(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    notes: input.notes.trim(),
    status: input.status,
  };

  return build_success(
    'Customer saved successfully.',
    { ...state, customers: [next_customer, ...state.customers] },
    next_customer.id,
  );
}

export function update_customer(
  state: InventoryState,
  customer_id: string,
  input: CustomerInput,
): StateOperationResult {
  const validation_message = validate_customer_input(input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const duplicate = state.customers.some(
    (customer) =>
      customer.id !== customer_id &&
      customer.name.toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    return build_failure('Customer name already exists.');
  }

  return build_success('Customer updated successfully.', {
    ...state,
    customers: state.customers.map((customer) =>
      customer.id === customer_id
        ? {
            ...customer,
            name: input.name.trim(),
            phone: input.phone.trim(),
            email: input.email.trim(),
            address: input.address.trim(),
            notes: input.notes.trim(),
            status: input.status,
            updated_at: new Date().toISOString(),
          }
        : customer,
    ),
  });
}

export function delete_customer(
  state: InventoryState,
  customer_id: string,
): StateOperationResult {
  const has_sales = state.sale_headers.some((sale) => sale.customer_id === customer_id);

  if (has_sales) {
    return build_failure(
      'This customer already has sales history. Deactivate it instead of deleting.',
    );
  }

  return build_success('Customer deleted successfully.', {
    ...state,
    customers: state.customers.filter((customer) => customer.id !== customer_id),
  });
}
