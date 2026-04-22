import { supabase } from '../lib/supabase';
import type {
  InventoryState,
  OperationResult,
  Product,
  ProductVariant,
  SaleItem,
  SaleRecord,
} from '../types/models';

interface ProductRow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  style_code: string;
  image_url: string | null;
  brand_id: string;
  category_id: string;
  target_group: Product['targetGroup'];
  base_price: number;
  description: string;
  status: Product['status'];
}

interface ProductVariantRow {
  id: string;
  created_at: string;
  updated_at: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  size: string;
  color: string;
  selling_price: number;
  cost_price: number;
  stock_qty: number;
  min_stock: number;
  status: ProductVariant['status'];
}

interface SaleHeaderRow {
  id: string;
  created_at: string;
  updated_at: string;
  receipt_no: string;
  sold_at: string;
  cashier_id: string;
  cashier_name: string;
  customer_name: string | null;
  payment_method: SaleRecord['paymentMethod'];
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  note: string;
  total_items: number;
  total_quantity: number;
  subtotal: number;
}

interface SaleItemRow {
  id: string;
  created_at: string;
  sale_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_sku: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_cost: number;
  line_total: number;
  line_profit: number;
}

interface RemoteEntityResult<T> extends OperationResult {
  record?: T;
}

function normalizePaymentMethod(value: string | null | undefined): SaleRecord['paymentMethod'] {
  if (value === 'card' || value === 'transfer') {
    return value;
  }

  return 'cash';
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

function buildRemoteFailure(message: string): OperationResult {
  return {
    ok: false,
    message,
  };
}

function buildRemoteSuccess(message: string, recordId?: string): OperationResult {
  return {
    ok: true,
    message,
    recordId,
  };
}

function mapProductRowToModel(row: ProductRow): Product {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    styleCode: row.style_code,
    imageUrl: row.image_url ?? '',
    brandId: row.brand_id,
    categoryId: row.category_id,
    targetGroup: row.target_group,
    basePrice: Number(row.base_price) || 0,
    description: row.description ?? '',
    status: row.status,
  };
}

function mapProductToRow(product: Product): ProductRow {
  return {
    id: product.id,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    name: product.name,
    style_code: product.styleCode,
    image_url: product.imageUrl?.trim() || null,
    brand_id: product.brandId,
    category_id: product.categoryId,
    target_group: product.targetGroup,
    base_price: Number(product.basePrice) || 0,
    description: product.description ?? '',
    status: product.status,
  };
}

function mapVariantRowToModel(row: ProductVariantRow): ProductVariant {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productId: row.product_id,
    sku: row.sku,
    barcode: row.barcode ?? '',
    size: row.size,
    color: row.color,
    sellingPrice: Number(row.selling_price) || 0,
    costPrice: Number(row.cost_price) || 0,
    stockQty: Number(row.stock_qty) || 0,
    minStock: Number(row.min_stock) || 0,
    status: row.status,
  };
}

function mapVariantToRow(variant: ProductVariant): ProductVariantRow {
  return {
    id: variant.id,
    created_at: variant.createdAt,
    updated_at: variant.updatedAt,
    product_id: variant.productId,
    sku: variant.sku,
    barcode: variant.barcode?.trim() || null,
    size: variant.size,
    color: variant.color,
    selling_price: Number(variant.sellingPrice) || 0,
    cost_price: Number(variant.costPrice) || 0,
    stock_qty: Number(variant.stockQty) || 0,
    min_stock: Number(variant.minStock) || 0,
    status: variant.status,
  };
}

function mapSaleItemRowToModel(row: SaleItemRow): SaleItem {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    productName: row.product_name,
    variantSku: row.variant_sku,
    size: row.size,
    color: row.color,
    quantity: Number(row.quantity) || 0,
    unitPrice: Number(row.unit_price) || 0,
    unitCost: Number(row.unit_cost) || 0,
    lineCost: Number(row.line_cost) || 0,
    lineTotal: Number(row.line_total) || 0,
    lineProfit: Number(row.line_profit) || 0,
  };
}

function mapSaleHeaderRowToModel(row: SaleHeaderRow, itemRows: SaleItemRow[]): SaleRecord {
  const items = itemRows.map(mapSaleItemRowToModel);

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    receiptNo: row.receipt_no,
    soldAt: row.sold_at,
    cashierId: row.cashier_id,
    cashierName: row.cashier_name,
    customerName: row.customer_name ?? '',
    paymentMethod: normalizePaymentMethod(row.payment_method),
    discountAmount: Number(row.discount_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    changeAmount: Number(row.change_amount) || 0,
    note: row.note ?? '',
    items,
    totalItems: Number(row.total_items) || items.length,
    totalQuantity: Number(row.total_quantity) || items.reduce((total, item) => total + item.quantity, 0),
    subtotal: Number(row.subtotal) || items.reduce((total, item) => total + item.lineTotal, 0),
  };
}

function mapSaleHeaderToRow(sale: SaleRecord): SaleHeaderRow {
  return {
    id: sale.id,
    created_at: sale.createdAt,
    updated_at: sale.updatedAt,
    receipt_no: sale.receiptNo,
    sold_at: sale.soldAt,
    cashier_id: sale.cashierId,
    cashier_name: sale.cashierName,
    customer_name: sale.customerName?.trim() || null,
    payment_method: normalizePaymentMethod(sale.paymentMethod),
    discount_amount: Number(sale.discountAmount) || 0,
    total_amount: Number(sale.totalAmount) || 0,
    paid_amount: Number(sale.paidAmount) || 0,
    change_amount: Number(sale.changeAmount) || 0,
    note: sale.note ?? '',
    total_items: Number(sale.totalItems) || sale.items.length,
    total_quantity: Number(sale.totalQuantity) || 0,
    subtotal: Number(sale.subtotal) || 0,
  };
}

function mapSaleItemToRow(item: SaleItem, saleId: string, createdAt: string): SaleItemRow {
  return {
    id: item.id,
    created_at: createdAt,
    sale_id: saleId,
    product_id: item.productId,
    variant_id: item.variantId,
    product_name: item.productName,
    variant_sku: item.variantSku,
    size: item.size,
    color: item.color,
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unitPrice) || 0,
    unit_cost: Number(item.unitCost) || 0,
    line_cost: Number(item.lineCost) || 0,
    line_total: Number(item.lineTotal) || 0,
    line_profit: Number(item.lineProfit) || 0,
  };
}

async function rollbackInsertedSale(saleId: string) {
  const client = getClient();

  await client.from('sale_items').delete().eq('sale_id', saleId);
  await client.from('sale_headers').delete().eq('id', saleId);
}

export async function fetchSupabaseInventorySlices(): Promise<
  Pick<InventoryState, 'products' | 'variants' | 'sales'>
> {
  const client = getClient();
  const [productsResult, variantsResult, saleHeadersResult, saleItemsResult] = await Promise.all([
    client.from('products').select('*').order('created_at', { ascending: false }),
    client.from('product_variants').select('*').order('created_at', { ascending: false }),
    client.from('sale_headers').select('*').order('sold_at', { ascending: false }),
    client.from('sale_items').select('*').order('created_at', { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  if (variantsResult.error) {
    throw new Error(variantsResult.error.message);
  }

  if (saleHeadersResult.error) {
    throw new Error(saleHeadersResult.error.message);
  }

  if (saleItemsResult.error) {
    throw new Error(saleItemsResult.error.message);
  }

  const salesItemsBySaleId = new Map<string, SaleItemRow[]>();

  for (const row of (saleItemsResult.data ?? []) as SaleItemRow[]) {
    const currentRows = salesItemsBySaleId.get(row.sale_id) ?? [];
    currentRows.push(row);
    salesItemsBySaleId.set(row.sale_id, currentRows);
  }

  return {
    products: ((productsResult.data ?? []) as ProductRow[]).map(mapProductRowToModel),
    variants: ((variantsResult.data ?? []) as ProductVariantRow[]).map(mapVariantRowToModel),
    sales: ((saleHeadersResult.data ?? []) as SaleHeaderRow[]).map((row) =>
      mapSaleHeaderRowToModel(row, salesItemsBySaleId.get(row.id) ?? []),
    ),
  };
}

export async function saveSupabaseProduct(product: Product): Promise<RemoteEntityResult<Product>> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('products')
      .upsert(mapProductToRow(product))
      .select()
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save the product to Supabase: ${error.message}`);
    }

    return {
      ok: true,
      message: 'Product saved successfully.',
      recordId: data.id,
      record: mapProductRowToModel(data as ProductRow),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the product to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function deleteSupabaseProduct(productId: string): Promise<OperationResult> {
  try {
    const client = getClient();
    const { error } = await client.from('products').delete().eq('id', productId);

    if (error) {
      return buildRemoteFailure(`Could not delete the product from Supabase: ${error.message}`);
    }

    return buildRemoteSuccess('Product deleted successfully.', productId);
  } catch (error) {
    return buildRemoteFailure(
      `Could not delete the product from Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function saveSupabaseVariant(
  variant: ProductVariant,
): Promise<RemoteEntityResult<ProductVariant>> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('product_variants')
      .upsert(mapVariantToRow(variant))
      .select()
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save the variant to Supabase: ${error.message}`);
    }

    return {
      ok: true,
      message: 'Variant saved successfully.',
      recordId: data.id,
      record: mapVariantRowToModel(data as ProductVariantRow),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the variant to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function saveSupabaseVariantsBatch(
  variants: ProductVariant[],
): Promise<OperationResult> {
  try {
    const client = getClient();
    const { error } = await client
      .from('product_variants')
      .upsert(variants.map(mapVariantToRow));

    if (error) {
      return buildRemoteFailure(
        `Could not sync variant stock to Supabase: ${error.message}`,
      );
    }

    return buildRemoteSuccess('Variants synced successfully.');
  } catch (error) {
    return buildRemoteFailure(
      `Could not sync variant stock to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function deleteSupabaseVariant(variantId: string): Promise<OperationResult> {
  try {
    const client = getClient();
    const { error } = await client.from('product_variants').delete().eq('id', variantId);

    if (error) {
      return buildRemoteFailure(`Could not delete the variant from Supabase: ${error.message}`);
    }

    return buildRemoteSuccess('Variant deleted successfully.', variantId);
  } catch (error) {
    return buildRemoteFailure(
      `Could not delete the variant from Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function createSupabaseSaleTransaction(
  sale: SaleRecord,
  updatedVariants: ProductVariant[],
): Promise<OperationResult> {
  try {
    const client = getClient();
    const saleHeaderRow = mapSaleHeaderToRow(sale);
    const saleItemRows = sale.items.map((item) => mapSaleItemToRow(item, sale.id, sale.createdAt));

    const headerInsert = await client.from('sale_headers').insert(saleHeaderRow);

    if (headerInsert.error) {
      return buildRemoteFailure(
        `Could not save the sale header to Supabase: ${headerInsert.error.message}`,
      );
    }

    const itemsInsert = await client.from('sale_items').insert(saleItemRows);

    if (itemsInsert.error) {
      await rollbackInsertedSale(sale.id);
      return buildRemoteFailure(
        `Could not save the sale items to Supabase: ${itemsInsert.error.message}`,
      );
    }

    const variantRows = updatedVariants.map(mapVariantToRow);
    const variantsUpdate = await client.from('product_variants').upsert(variantRows);

    if (variantsUpdate.error) {
      await rollbackInsertedSale(sale.id);
      return buildRemoteFailure(
        `Could not update sold stock in Supabase: ${variantsUpdate.error.message}`,
      );
    }

    return buildRemoteSuccess('Sale completed successfully.', sale.id);
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the sale to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}
