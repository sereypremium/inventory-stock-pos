import type { StockInInput, SupplierInput } from '../types/models';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSupplierInput(input: SupplierInput) {
  if (!input.name.trim()) {
    return 'Supplier name is required.';
  }

  if (!input.code.trim()) {
    return 'Supplier code is required.';
  }

  if (!input.contactPerson.trim()) {
    return 'Contact person is required.';
  }

  if (!input.phone.trim()) {
    return 'Phone number is required.';
  }

  if (!input.address.trim()) {
    return 'Address is required.';
  }

  if (input.email.trim() && !emailPattern.test(input.email.trim())) {
    return 'Supplier email format is invalid.';
  }

  return null;
}

export function validateStockInHeader(input: StockInInput) {
  if (!input.referenceNo.trim()) {
    return 'Reference number is required.';
  }

  if (!input.supplierId.trim()) {
    return 'Supplier selection is required.';
  }

  if (!input.receivedDate.trim()) {
    return 'Received date is required.';
  }

  if (Number.isNaN(new Date(input.receivedDate).getTime())) {
    return 'Received date is invalid.';
  }

  if (!input.receivedBy.trim()) {
    return 'Received by is required.';
  }

  if (input.items.length === 0) {
    return 'Add at least one stock in item row.';
  }

  return null;
}

export function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function isPositiveNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}
