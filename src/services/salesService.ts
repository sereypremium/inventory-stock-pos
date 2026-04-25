import type {
  InventoryState,
  OperationResult,
  PaymentMethod,
  SaleInput,
  SaleItem,
  SaleRecord,
} from '../types/models';

interface SalesServiceResult extends OperationResult {
  nextState?: InventoryState;
}

const validPaymentMethods: PaymentMethod[] = ['cash', 'card', 'transfer'];

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

function createReceiptNo(state: InventoryState, soldAt: string) {
  const dayToken = soldAt.slice(0, 10).replaceAll('-', '');
  const sequencePrefix = `POS-${dayToken}-`;
  const sameDaySequences = state.sales
    .map((sale) => sale.receiptNo)
    .filter((receiptNo) => receiptNo.startsWith(sequencePrefix))
    .map((receiptNo) => Number(receiptNo.slice(sequencePrefix.length)))
    .filter(Number.isInteger);
  const sequence = String(Math.max(0, ...sameDaySequences) + 1).padStart(4, '0');

  return `POS-${dayToken}-${sequence}`;
}

export function getSaleDiscountAmount(sale: Pick<SaleRecord, 'discountAmount'>) {
  return Math.max(Number(sale.discountAmount) || 0, 0);
}

export function getSaleGrandTotal(
  sale: Pick<SaleRecord, 'subtotal' | 'discountAmount' | 'totalAmount'>,
) {
  const discountAmount = getSaleDiscountAmount(sale);
  const subtotal = Number(sale.subtotal) || 0;
  const totalAmount = Number(sale.totalAmount);

  if (Number.isFinite(totalAmount) && totalAmount >= 0) {
    return totalAmount;
  }

  return Math.max(subtotal - discountAmount, 0);
}

export function createSaleTransaction(
  state: InventoryState,
  input: SaleInput,
): SalesServiceResult {
  if (!input.cashierId.trim() || !input.cashierName.trim()) {
    return {
      ok: false,
      message: 'Cashier information is required before checkout.',
    };
  }

  if (!validPaymentMethods.includes(input.paymentMethod)) {
    return {
      ok: false,
      message: 'Select a valid payment method.',
    };
  }

  if (input.items.length === 0) {
    return {
      ok: false,
      message: 'Add at least one item to the cart before checkout.',
    };
  }

  const mergedItems = new Map<string, number>();

  for (const item of input.items) {
    const normalizedVariantId = item.variantId.trim();

    if (!normalizedVariantId) {
      return {
        ok: false,
        message: 'Every cart item must reference a product variant.',
      };
    }

    if (!isPositiveInteger(Number(item.quantity))) {
      return {
        ok: false,
        message: 'Cart quantities must be whole numbers above zero.',
      };
    }

    mergedItems.set(
      normalizedVariantId,
      (mergedItems.get(normalizedVariantId) ?? 0) + Number(item.quantity),
    );
  }

  const variantsById = new Map(state.variants.map((variant) => [variant.id, variant]));
  const productsById = new Map(state.products.map((product) => [product.id, product]));
  const saleItems: SaleItem[] = [];

  for (const [variantId, quantity] of mergedItems.entries()) {
    const variant = variantsById.get(variantId);

    if (!variant) {
      return {
        ok: false,
        message: 'One or more cart variants are no longer available.',
      };
    }

    const product = productsById.get(variant.productId);

    if (!product) {
      return {
        ok: false,
        message: 'One or more cart variants are missing their parent product.',
      };
    }

    if (variant.status !== 'active' || product.status !== 'active') {
      return {
        ok: false,
        message: `${product.name} ${variant.size}/${variant.color} is not active for sale.`,
      };
    }

    if (quantity > variant.stockQty) {
      return {
        ok: false,
        message: `${product.name} ${variant.size}/${variant.color} has only ${variant.stockQty} in stock.`,
      };
    }

    saleItems.push({
      id: crypto.randomUUID(),
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantSku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity,
      unitPrice: variant.sellingPrice,
      unitCost: variant.costPrice,
      lineCost: quantity * variant.costPrice,
      lineTotal: quantity * variant.sellingPrice,
      lineProfit: quantity * (variant.sellingPrice - variant.costPrice),
    });
  }

  const subtotal = saleItems.reduce((total, item) => total + item.lineTotal, 0);
  const discountAmount = Math.max(Number(input.discountAmount) || 0, 0);
  const totalAmount = Math.max(subtotal - discountAmount, 0);
  const paidAmount = Number(input.paidAmount);

  if (!Number.isFinite(paidAmount) || paidAmount < totalAmount) {
    return {
      ok: false,
      message: 'Paid amount must cover the full sale total.',
    };
  }

  const soldAt = new Date().toISOString();
  const now = soldAt;
  const nextRecord: SaleRecord = {
    id: crypto.randomUUID(),
    receiptNo: createReceiptNo(state, soldAt),
    soldAt,
    cashierId: input.cashierId.trim(),
    cashierName: input.cashierName.trim(),
    customerName: input.customerName?.trim() ?? '',
    paymentMethod: input.paymentMethod,
    discountAmount,
    totalAmount,
    paidAmount,
    changeAmount: paidAmount - totalAmount,
    note: input.note.trim(),
    items: saleItems,
    totalItems: saleItems.length,
    totalQuantity: saleItems.reduce((total, item) => total + item.quantity, 0),
    subtotal,
    createdAt: now,
    updatedAt: now,
  };

  const nextVariants = state.variants.map((variant) => {
    const matchingItem = saleItems.find((item) => item.variantId === variant.id);

    if (!matchingItem) {
      return variant;
    }

    return {
      ...variant,
      stockQty: variant.stockQty - matchingItem.quantity,
      updatedAt: now,
    };
  });

  return {
    ok: true,
    message: 'Sale completed successfully.',
    recordId: nextRecord.id,
    nextState: {
      ...state,
      variants: nextVariants,
      sales: [nextRecord, ...state.sales],
    },
  };
}
