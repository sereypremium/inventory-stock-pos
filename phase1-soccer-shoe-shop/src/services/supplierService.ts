import type {
  InventoryState,
  StateOperationResult,
  Supplier,
  SupplierInput,
} from '../types/models';
import { build_failure, build_success, create_timestamps } from './serviceHelpers';

function validate_supplier_input(input: SupplierInput) {
  if (!input.name.trim()) {
    return 'Supplier name is required.';
  }

  return null;
}

export function create_supplier(
  state: InventoryState,
  input: SupplierInput,
): StateOperationResult {
  const validation_message = validate_supplier_input(input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const duplicate = state.suppliers.some(
    (supplier) => supplier.name.toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    return build_failure('Supplier name already exists.');
  }

  const next_supplier: Supplier = {
    id: crypto.randomUUID(),
    ...create_timestamps(),
    name: input.name.trim(),
    contact_person: input.contact_person.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    notes: input.notes.trim(),
    status: input.status,
  };

  return build_success(
    'Supplier saved successfully.',
    { ...state, suppliers: [next_supplier, ...state.suppliers] },
    next_supplier.id,
  );
}

export function update_supplier(
  state: InventoryState,
  supplier_id: string,
  input: SupplierInput,
): StateOperationResult {
  const validation_message = validate_supplier_input(input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const duplicate = state.suppliers.some(
    (supplier) =>
      supplier.id !== supplier_id &&
      supplier.name.toLowerCase() === input.name.trim().toLowerCase(),
  );

  if (duplicate) {
    return build_failure('Supplier name already exists.');
  }

  return build_success('Supplier updated successfully.', {
    ...state,
    suppliers: state.suppliers.map((supplier) =>
      supplier.id === supplier_id
        ? {
            ...supplier,
            name: input.name.trim(),
            contact_person: input.contact_person.trim(),
            phone: input.phone.trim(),
            email: input.email.trim(),
            address: input.address.trim(),
            notes: input.notes.trim(),
            status: input.status,
            updated_at: new Date().toISOString(),
          }
        : supplier,
    ),
  });
}

export function delete_supplier(
  state: InventoryState,
  supplier_id: string,
): StateOperationResult {
  const has_purchases = state.purchase_headers.some(
    (purchase) => purchase.supplier_id === supplier_id,
  );

  if (has_purchases) {
    return build_failure(
      'This supplier already has stock-in records. Deactivate it instead of deleting.',
    );
  }

  return build_success('Supplier deleted successfully.', {
    ...state,
    suppliers: state.suppliers.filter((supplier) => supplier.id !== supplier_id),
  });
}
