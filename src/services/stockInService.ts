import { isPositiveInteger, isPositiveNumber, validateStockInHeader } from './inventoryValidation';
import type {
  InventoryState,
  OperationResult,
  StockInInput,
  StockInItem,
  StockInRecord,
} from '../types/models';

interface StockInServiceResult extends OperationResult {
  nextState?: InventoryState;
}

function createTimestamp() {
  return new Date().toISOString();
}

export function createStockInTransaction(
  state: InventoryState,
  input: StockInInput,
): StockInServiceResult {
  const headerError = validateStockInHeader(input);

  if (headerError) {
    return {
      ok: false,
      message: headerError,
    };
  }

  const supplier = state.suppliers.find((entry) => entry.id === input.supplierId);

  if (!supplier) {
    return {
      ok: false,
      message: 'Select a valid supplier before posting stock in.',
    };
  }

  const normalizedReferenceNo = input.referenceNo.trim().toUpperCase();
  const duplicateReference = state.stockIns.some(
    (record) => record.referenceNo.toLowerCase() === normalizedReferenceNo.toLowerCase(),
  );

  if (duplicateReference) {
    return {
      ok: false,
      message: 'Reference number already exists.',
    };
  }

  const variantsById = new Map(state.variants.map((variant) => [variant.id, variant]));
  const productsById = new Map(state.products.map((product) => [product.id, product]));
  const seenVariants = new Set<string>();

  for (const item of input.items) {
    const normalizedVariantId = item.variantId.trim();

    if (!normalizedVariantId) {
      return {
        ok: false,
        message: 'Each stock in row must select a product variant.',
      };
    }

    if (seenVariants.has(normalizedVariantId)) {
      return {
        ok: false,
        message: 'Each variant should appear only once per stock in transaction.',
      };
    }

    seenVariants.add(normalizedVariantId);

    if (!isPositiveInteger(Number(item.quantity))) {
      return {
        ok: false,
        message: 'Each stock in quantity must be a whole number greater than zero.',
      };
    }

    if (!isPositiveNumber(Number(item.unitCost))) {
      return {
        ok: false,
        message: 'Each unit cost must be greater than zero.',
      };
    }

    const variant = variantsById.get(normalizedVariantId);

    if (!variant) {
      return {
        ok: false,
        message: 'One or more selected variants no longer exist.',
      };
    }

    if (!productsById.get(variant.productId)) {
      return {
        ok: false,
        message: 'One or more selected variants are missing their parent product.',
      };
    }
  }

  const now = createTimestamp();
  const recordItems: StockInItem[] = input.items.map((item) => {
    const variant = variantsById.get(item.variantId)!;
    const product = productsById.get(variant.productId)!;
    const quantity = Number(item.quantity);
    const unitCost = Number(item.unitCost);

    return {
      id: crypto.randomUUID(),
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantSku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity,
      unitCost,
      lineTotal: quantity * unitCost,
    };
  });

  const nextRecord: StockInRecord = {
    id: crypto.randomUUID(),
    referenceNo: normalizedReferenceNo,
    supplierId: supplier.id,
    supplierName: supplier.name,
    receivedDate: input.receivedDate,
    receivedBy: input.receivedBy.trim(),
    note: input.note.trim(),
    items: recordItems,
    totalItems: recordItems.length,
    totalQuantity: recordItems.reduce((total, item) => total + item.quantity, 0),
    totalCost: recordItems.reduce((total, item) => total + item.lineTotal, 0),
    createdAt: now,
    updatedAt: now,
  };

  const nextVariants = state.variants.map((variant) => {
    const matchingItem = recordItems.find((item) => item.variantId === variant.id);

    if (!matchingItem) {
      return variant;
    }

    return {
      ...variant,
      stockQty: variant.stockQty + matchingItem.quantity,
      updatedAt: now,
    };
  });

  return {
    ok: true,
    message: 'Stock in posted successfully.',
    recordId: nextRecord.id,
    nextState: {
      ...state,
      variants: nextVariants,
      stockIns: [nextRecord, ...state.stockIns],
    },
  };
}
