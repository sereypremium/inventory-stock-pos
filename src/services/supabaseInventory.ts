import { supabase } from '../lib/supabase';
import type {
  Brand,
  Category,
  InventoryState,
  OperationResult,
  Product,
  ProductVariant,
  SaleItem,
  SaleRecord,
  StockInItem,
  StockInRecord,
  Supplier,
} from '../types/models';

interface BrandRow {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  name: string;
  code: string;
  origin_country: string;
  status: Brand['status'];
}

interface CategoryRow {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  name: string;
  code: string;
  description: string;
  status: Category['status'];
}

interface ProductRow {
  id: string;
  created_at: string;
  updated_at: string;
  name?: string;
  code?: string;
  product_name?: string;
  style_code?: string;
  model_name?: string;
  product_code?: string;
  image_url: string | null;
  brand_id: string;
  category_id: string;
  target_group?: Product['targetGroup'];
  gender?: Product['targetGroup'];
  base_price: number;
  description: string;
  status: Product['status'];
}

interface ProductVariantRow {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  size: number;
  color: string;
  cost_price: number;
  sale_price: number;
  stock_qty: number;
  min_stock_qty: number;
  status: ProductVariant['status'];
}

interface SupplierRow {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  name: string;
  code: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  status: Supplier['status'];
}

interface PurchaseHeaderRow {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  reference_no: string;
  supplier_id: string;
  supplier_name: string;
  received_date: string;
  received_by: string;
  note: string;
  total_items: number;
  total_quantity: number;
  total_cost: number;
}

interface PurchaseItemRow {
  id: string;
  created_at: string;
  created_by?: string | null;
  purchase_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_sku: string;
  size: string;
  color: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

interface SaleHeaderRow {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  receipt_no?: string;
  sale_no?: string;
  sold_at?: string;
  sale_date?: string;
  cashier_id?: string;
  cashier_name?: string;
  customer_name?: string | null;
  customer_id?: string | null;
  payment_method: SaleRecord['paymentMethod'];
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  note?: string;
  notes?: string;
  total_items?: number;
  total_quantity?: number;
  subtotal: number;
}

interface SaleItemRow {
  id: string;
  created_at: string;
  created_by?: string | null;
  sale_id: string;
  product_id?: string;
  variant_id?: string;
  product_variant_id?: string;
  product_name?: string;
  variant_sku?: string;
  size?: string;
  color?: string;
  quantity?: number;
  qty?: number;
  unit_price?: number;
  sale_price?: number;
  unit_cost?: number;
  cost_price?: number;
  line_cost?: number;
  line_total: number;
  line_profit?: number;
}

interface RemoteEntityResult<T> extends OperationResult {
  record?: T;
}

interface SupabaseQueryError {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message?: string;
}

interface InsertAttemptResult {
  data?: unknown;
  error: SupabaseQueryError | null;
}

export class SupabaseInventoryError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SupabaseInventoryError';
    this.code = code;
  }
}

const PRODUCT_COLUMNS = [
  'id',
  'created_at',
  'updated_at',
  'product_name',
  'style_code',
  'brand_id',
  'category_id',
  'target_group',
  'base_price',
  'image_url',
  'description',
  'status',
].join(',');

type ProductSchemaKey =
  | 'productNameStyleCode'
  | 'productNameProductCode'
  | 'modelNameProductCode'
  | 'nameCode'
  | 'nameProductCode';

interface ProductSchemaDefinition {
  key: ProductSchemaKey;
  columns: string;
  nameColumn: 'name' | 'product_name' | 'model_name';
  codeColumn: 'code' | 'style_code' | 'product_code';
  targetGroupColumn: 'target_group' | 'gender';
}

const PRODUCT_SCHEMA_CANDIDATES: ProductSchemaDefinition[] = [
  {
    key: 'productNameStyleCode',
    columns: PRODUCT_COLUMNS,
    nameColumn: 'product_name',
    codeColumn: 'style_code',
    targetGroupColumn: 'target_group',
  },
  {
    key: 'productNameProductCode',
    columns: [
      'id',
      'created_at',
      'updated_at',
      'product_name',
      'product_code',
      'brand_id',
      'category_id',
      'target_group',
      'base_price',
      'image_url',
      'description',
      'status',
    ].join(','),
    nameColumn: 'product_name',
    codeColumn: 'product_code',
    targetGroupColumn: 'target_group',
  },
  {
    key: 'modelNameProductCode',
    columns: [
      'id',
      'created_at',
      'updated_at',
      'model_name',
      'product_code',
      'brand_id',
      'category_id',
      'gender',
      'base_price',
      'image_url',
      'description',
      'status',
    ].join(','),
    nameColumn: 'model_name',
    codeColumn: 'product_code',
    targetGroupColumn: 'gender',
  },
  {
    key: 'nameCode',
    columns: [
      'id',
      'created_at',
      'updated_at',
      'name',
      'code',
      'brand_id',
      'category_id',
      'target_group',
      'base_price',
      'image_url',
      'description',
      'status',
    ].join(','),
    nameColumn: 'name',
    codeColumn: 'code',
    targetGroupColumn: 'target_group',
  },
  {
    key: 'nameProductCode',
    columns: [
      'id',
      'created_at',
      'updated_at',
      'name',
      'product_code',
      'brand_id',
      'category_id',
      'target_group',
      'base_price',
      'image_url',
      'description',
      'status',
    ].join(','),
    nameColumn: 'name',
    codeColumn: 'product_code',
    targetGroupColumn: 'target_group',
  },
];

let activeProductSchema = PRODUCT_SCHEMA_CANDIDATES[0];

const PRODUCT_VARIANT_COLUMNS = [
  'id',
  'product_id',
  'sku',
  'barcode',
  'size',
  'color',
  'cost_price',
  'sale_price',
  'stock_qty',
  'min_stock_qty',
  'status',
].join(',');

function normalizePaymentMethod(value: string | null | undefined): SaleRecord['paymentMethod'] {
  if (value === 'card' || value === 'transfer') {
    return value;
  }

  return 'cash';
}

function firstNonBlankString(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? '';
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

async function getAuthenticatedUserId() {
  const client = getClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error(error?.message || 'Sign in again before saving this transaction.');
  }

  return data.user.id;
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

function buildLegacyTransactionSchemaMessage(
  label: string,
  error: SupabaseQueryError,
  repairScript: string,
) {
  return `${label} Your connected Supabase project still has legacy transaction columns or schema cache metadata that do not match the current app. Run \`${repairScript}\` in the Supabase SQL Editor, then refresh and try again. Original error: ${error.message ?? 'Unknown transaction schema error.'}`;
}

function buildSupabaseReadErrorMessage(label: string, error: SupabaseQueryError) {
  const details = [error.message, error.details, error.hint].filter(Boolean).join(' ');
  const code = error.code ? ` [${error.code}]` : '';

  if (error.code === '42703') {
    return `Schema mismatch: ${label} query references a column that does not exist${code}. ${details || 'Check the frontend selected columns against the real Supabase table schema.'}`;
  }

  return `${label} could not be loaded from Supabase${code}: ${details || 'Unknown query error.'}`;
}

function throwSupabaseReadError(label: string, error: SupabaseQueryError): never {
  throw new SupabaseInventoryError(buildSupabaseReadErrorMessage(label, error), error.code);
}

function isSchemaMismatchError(error: SupabaseQueryError | null | undefined) {
  const message = error?.message?.toLowerCase() ?? '';

  return error?.code === '42703' || message.includes('does not exist');
}

function isMissingCreatedByInsertError(error: SupabaseQueryError | null | undefined) {
  const combinedMessage = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    combinedMessage.includes('created_by') &&
    (combinedMessage.includes('schema cache') ||
      combinedMessage.includes('does not exist') ||
      error?.code === '42703')
  );
}

function isLegacyInsertCompatibilityError(error: SupabaseQueryError | null | undefined) {
  const combinedMessage = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    isMissingCreatedByInsertError(error) ||
    combinedMessage.includes('schema cache') ||
    combinedMessage.includes('column') && combinedMessage.includes('does not exist') ||
    combinedMessage.includes('invalid input syntax for type bigint') ||
    combinedMessage.includes('invalid input syntax for type integer') ||
    combinedMessage.includes('invalid input syntax for type smallint')
  );
}

function isLegacySaleHeaderInsertError(error: SupabaseQueryError | null | undefined) {
  const combinedMessage = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    isLegacyInsertCompatibilityError(error) ||
    combinedMessage.includes('sale_no') ||
    combinedMessage.includes('sale_date')
  );
}

function isLegacySaleItemInsertError(error: SupabaseQueryError | null | undefined) {
  const combinedMessage = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    isLegacyInsertCompatibilityError(error) ||
    combinedMessage.includes('product_variant_id') ||
    combinedMessage.includes('qty')
  );
}

function omitFields<Row extends object>(row: Row, fields: string[]) {
  const entries = Object.entries(row as Record<string, unknown>).filter(
    ([field]) => !fields.includes(field),
  );

  return Object.fromEntries(entries);
}

function buildTransactionInsertFailureMessage(
  label: string,
  error: SupabaseQueryError,
  repairScript: string,
) {
  if (isLegacyInsertCompatibilityError(error)) {
    return buildLegacyTransactionSchemaMessage(label, error, repairScript);
  }

  return `${label} ${error.message ?? 'Unknown transaction save error.'}`;
}

function buildLegacyInsertFieldFallbacks(row: object) {
  const fallbackFields = ['created_by', 'id', 'cashier_id'].filter((field) => field in row);
  const fieldSets = new Set<string>(['']);

  for (const field of fallbackFields) {
    for (const currentSet of [...fieldSets]) {
      const nextParts = currentSet ? currentSet.split('|') : [];
      nextParts.push(field);
      nextParts.sort();
      fieldSets.add(nextParts.join('|'));
    }
  }

  return [...fieldSets].map((entry) => (entry ? entry.split('|') : []));
}

async function insertSingleWithFallback(
  table: string,
  payload: object,
  userId: string,
): Promise<InsertAttemptResult> {
  const client = getClient();
  const payloadWithCreatedBy = { ...payload, created_by: userId };
  let lastResult: InsertAttemptResult = {
    error: { message: `Could not insert into ${table}.` },
  };

  for (const fieldsToOmit of buildLegacyInsertFieldFallbacks(payloadWithCreatedBy)) {
    const candidatePayload = omitFields(payloadWithCreatedBy, fieldsToOmit);
    const result = await client
      .from(table)
      .insert(candidatePayload as never)
      .select('id')
      .single() as unknown as InsertAttemptResult;

    if (!result.error) {
      return result;
    }

    lastResult = result;

    if (!isLegacyInsertCompatibilityError(result.error)) {
      return result;
    }
  }

  return lastResult;
}

async function insertManyWithFallback(
  table: string,
  payload: object[],
  userId: string,
): Promise<InsertAttemptResult> {
  const client = getClient();
  const payloadWithCreatedBy = payload.map((row) => ({ ...row, created_by: userId }));
  const fallbackMatrix = payloadWithCreatedBy[0]
    ? buildLegacyInsertFieldFallbacks(payloadWithCreatedBy[0])
    : [[]];
  let lastResult: InsertAttemptResult = {
    error: { message: `Could not insert rows into ${table}.` },
  };

  for (const fieldsToOmit of fallbackMatrix) {
    const candidatePayload = payloadWithCreatedBy.map((row) => omitFields(row, fieldsToOmit));
    const result = await client.from(table).insert(candidatePayload as never) as unknown as InsertAttemptResult;

    if (!result.error) {
      return result;
    }

    lastResult = result;

    if (!isLegacyInsertCompatibilityError(result.error)) {
      return result;
    }
  }

  return lastResult;
}

function getInsertedRecordId(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    (typeof (value as { id: unknown }).id === 'string' ||
      typeof (value as { id: unknown }).id === 'number')
  ) {
    return (value as { id: string | number }).id;
  }

  return null;
}

function getProductSchemaAttemptOrder() {
  return [
    activeProductSchema,
    ...PRODUCT_SCHEMA_CANDIDATES.filter((schema) => schema.key !== activeProductSchema.key),
  ];
}

function coerceVariantSize(size: string) {
  const nextSize = Number(size);

  if (!Number.isInteger(nextSize)) {
    throw new Error('Variant size must be a whole number to match the Supabase product_variants.size column.');
  }

  return nextSize;
}

function getProductRowValue(
  row: ProductRow,
  key: ProductSchemaDefinition['nameColumn'] | ProductSchemaDefinition['codeColumn'],
) {
  return row[key] ?? '';
}

function getProductTargetGroup(row: ProductRow, schema: ProductSchemaDefinition) {
  return row[schema.targetGroupColumn] ?? 'unisex';
}

function mapBrandRowToModel(row: BrandRow): Brand {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    code: row.code,
    originCountry: row.origin_country ?? '',
    status: row.status,
  };
}

function mapBrandToRow(brand: Brand): BrandRow {
  return {
    id: brand.id,
    created_at: brand.createdAt,
    updated_at: brand.updatedAt,
    name: brand.name,
    code: brand.code,
    origin_country: brand.originCountry,
    status: brand.status,
  };
}

function mapCategoryRowToModel(row: CategoryRow): Category {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    code: row.code,
    description: row.description ?? '',
    status: row.status,
  };
}

function mapCategoryToRow(category: Category): CategoryRow {
  return {
    id: category.id,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
    name: category.name,
    code: category.code,
    description: category.description ?? '',
    status: category.status,
  };
}

function mapProductRowToModel(row: ProductRow, schema = activeProductSchema): Product {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: getProductRowValue(row, schema.nameColumn),
    styleCode: getProductRowValue(row, schema.codeColumn),
    imageUrl: row.image_url ?? '',
    brandId: row.brand_id,
    categoryId: row.category_id,
    targetGroup: getProductTargetGroup(row, schema),
    basePrice: Number(row.base_price) || 0,
    description: row.description ?? '',
    status: row.status,
  };
}

function mapProductToRow(product: Product, schema = activeProductSchema): ProductRow {
  return {
    id: product.id,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    [schema.nameColumn]: product.name,
    [schema.codeColumn]: product.styleCode,
    image_url: product.imageUrl?.trim() || null,
    brand_id: product.brandId,
    category_id: product.categoryId,
    [schema.targetGroupColumn]: product.targetGroup,
    base_price: Number(product.basePrice) || 0,
    description: product.description ?? '',
    status: product.status,
  } as ProductRow;
}

function mapVariantRowToModel(row: ProductVariantRow): ProductVariant {
  const timestamp = new Date().toISOString();

  return {
    id: row.id,
    createdAt: timestamp,
    updatedAt: timestamp,
    productId: row.product_id,
    sku: row.sku,
    barcode: row.barcode ?? '',
    size: String(row.size),
    color: row.color,
    costPrice: Number(row.cost_price) || 0,
    sellingPrice: Number(row.sale_price) || 0,
    stockQty: Number(row.stock_qty) || 0,
    minStock: Number(row.min_stock_qty) || 0,
    imageUrl: '',
    status: row.status,
  };
}

function mapVariantToRow(variant: ProductVariant): ProductVariantRow {
  return {
    id: variant.id,
    product_id: variant.productId,
    sku: variant.sku,
    barcode: variant.barcode?.trim() || null,
    size: coerceVariantSize(variant.size),
    color: variant.color,
    cost_price: Number(variant.costPrice) || 0,
    sale_price: Number(variant.sellingPrice) || 0,
    stock_qty: Number(variant.stockQty) || 0,
    min_stock_qty: Number(variant.minStock) || 0,
    status: variant.status,
  };
}

function mapSupplierRowToModel(row: SupplierRow): Supplier {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    code: row.code,
    contactPerson: row.contact_person ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    status: row.status,
  };
}

function mapSupplierToRow(supplier: Supplier): SupplierRow {
  return {
    id: supplier.id,
    created_at: supplier.createdAt,
    updated_at: supplier.updatedAt,
    name: supplier.name,
    code: supplier.code,
    contact_person: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    status: supplier.status,
  };
}

function mapPurchaseItemRowToModel(row: PurchaseItemRow): StockInItem {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    productName: row.product_name,
    variantSku: row.variant_sku,
    size: row.size,
    color: row.color,
    quantity: Number(row.quantity) || 0,
    unitCost: Number(row.unit_cost) || 0,
    lineTotal: Number(row.line_total) || 0,
  };
}

function mapPurchaseHeaderRowToModel(
  row: PurchaseHeaderRow,
  itemRows: PurchaseItemRow[],
): StockInRecord {
  const items = itemRows.map(mapPurchaseItemRowToModel);

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    referenceNo: row.reference_no,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    receivedDate: row.received_date,
    receivedBy: row.received_by,
    note: row.note ?? '',
    items,
    totalItems: Number(row.total_items) || items.length,
    totalQuantity: Number(row.total_quantity) || items.reduce((total, item) => total + item.quantity, 0),
    totalCost: Number(row.total_cost) || items.reduce((total, item) => total + item.lineTotal, 0),
  };
}

function mapPurchaseHeaderToRow(stockIn: StockInRecord): PurchaseHeaderRow {
  return {
    id: stockIn.id,
    created_at: stockIn.createdAt,
    updated_at: stockIn.updatedAt,
    reference_no: stockIn.referenceNo,
    supplier_id: stockIn.supplierId,
    supplier_name: stockIn.supplierName,
    received_date: stockIn.receivedDate,
    received_by: stockIn.receivedBy,
    note: stockIn.note ?? '',
    total_items: Number(stockIn.totalItems) || stockIn.items.length,
    total_quantity: Number(stockIn.totalQuantity) || 0,
    total_cost: Number(stockIn.totalCost) || 0,
  };
}

function mapPurchaseItemToRow(
  item: StockInItem,
  purchaseId: string,
  createdAt: string,
): PurchaseItemRow {
  return {
    id: item.id,
    created_at: createdAt,
    purchase_id: purchaseId,
    product_id: item.productId,
    variant_id: item.variantId,
    product_name: item.productName,
    variant_sku: item.variantSku,
    size: item.size,
    color: item.color,
    quantity: Number(item.quantity) || 0,
    unit_cost: Number(item.unitCost) || 0,
    line_total: Number(item.lineTotal) || 0,
  };
}

function mapSaleItemRowToModel(row: SaleItemRow): SaleItem {
  const quantity = Number(row.quantity ?? row.qty) || 0;
  const unitPrice = Number(row.unit_price ?? row.sale_price) || 0;
  const unitCost = Number(row.unit_cost ?? row.cost_price) || 0;
  const lineCost = Number(row.line_cost) || quantity * unitCost;
  const lineTotal = Number(row.line_total) || 0;

  return {
    id: String(row.id),
    productId: row.product_id ?? '',
    variantId: row.variant_id ?? row.product_variant_id ?? '',
    productName: row.product_name ?? 'Sale item',
    variantSku: row.variant_sku ?? '',
    size: row.size ?? '',
    color: row.color ?? '',
    quantity,
    unitPrice,
    unitCost,
    lineCost,
    lineTotal,
    lineProfit: Number(row.line_profit) || lineTotal - lineCost,
  };
}

function mapSaleHeaderRowToModel(row: SaleHeaderRow, itemRows: SaleItemRow[]): SaleRecord {
  const items = itemRows.map(mapSaleItemRowToModel);
  const receiptNo = firstNonBlankString(row.receipt_no, row.sale_no, String(row.id));
  const soldAt = firstNonBlankString(row.sold_at, row.sale_date, row.created_at);
  const cashierId = firstNonBlankString(row.cashier_id, row.created_by);

  return {
    id: String(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    receiptNo,
    soldAt,
    cashierId,
    cashierName: firstNonBlankString(row.cashier_name, cashierId),
    customerName: row.customer_name ?? '',
    paymentMethod: normalizePaymentMethod(row.payment_method),
    discountAmount: Number(row.discount_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    changeAmount: Number(row.change_amount) || 0,
    note: firstNonBlankString(row.note, row.notes),
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

function mapSaleHeaderToLegacyRow(sale: SaleRecord) {
  return {
    id: sale.id,
    created_at: sale.createdAt,
    updated_at: sale.updatedAt,
    sale_no: sale.receiptNo,
    sale_date: sale.soldAt,
    customer_id: null,
    subtotal: Number(sale.subtotal) || 0,
    discount_amount: Number(sale.discountAmount) || 0,
    total_amount: Number(sale.totalAmount) || 0,
    paid_amount: Number(sale.paidAmount) || 0,
    change_amount: Number(sale.changeAmount) || 0,
    payment_method: normalizePaymentMethod(sale.paymentMethod),
    notes: sale.note ?? '',
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

function mapSaleItemToLegacyRow(item: SaleItem, saleId: string, createdAt: string) {
  return {
    id: item.id,
    created_at: createdAt,
    sale_id: saleId,
    product_variant_id: item.variantId,
    qty: Number(item.quantity) || 0,
    cost_price: Number(item.unitCost) || 0,
    sale_price: Number(item.unitPrice) || 0,
    discount_amount: 0,
    line_total: Number(item.lineTotal) || 0,
  };
}

async function rollbackInsertedSale(saleId: string) {
  const client = getClient();

  await client.from('sale_items').delete().eq('sale_id', saleId);
  await client.from('sale_headers').delete().eq('id', saleId);
}

async function rollbackInsertedPurchase(purchaseId: string) {
  const client = getClient();

  await client.from('purchase_items').delete().eq('purchase_id', purchaseId);
  await client.from('purchase_headers').delete().eq('id', purchaseId);
}

async function fetchProductRows() {
  const client = getClient();
  let lastError: SupabaseQueryError | null = null;

  for (const schema of getProductSchemaAttemptOrder()) {
    const result = await client
      .from('products')
      .select(schema.columns)
      .order('created_at', { ascending: false });

    if (!result.error) {
      activeProductSchema = schema;
      return ((result.data ?? []) as unknown as ProductRow[]).map((row) =>
        mapProductRowToModel(row, schema),
      );
    }

    lastError = result.error;

    if (!isSchemaMismatchError(result.error)) {
      break;
    }
  }

  throwSupabaseReadError('Products', lastError ?? { message: 'Unknown product query error.' });
}

export async function fetchSupabaseInventorySlices(): Promise<
  Pick<
    InventoryState,
    'brands' | 'categories' | 'products' | 'variants' | 'suppliers' | 'stockIns' | 'sales'
  >
> {
  const client = getClient();
  const [
    brandsResult,
    categoriesResult,
    productsResult,
    variantsResult,
    suppliersResult,
    purchaseHeadersResult,
    purchaseItemsResult,
    saleHeadersResult,
    saleItemsResult,
  ] = await Promise.all([
    client.from('brands').select('*').order('created_at', { ascending: false }),
    client.from('categories').select('*').order('created_at', { ascending: false }),
    fetchProductRows(),
    client.from('product_variants').select(PRODUCT_VARIANT_COLUMNS).order('sku', { ascending: true }),
    client.from('suppliers').select('*').order('created_at', { ascending: false }),
    client.from('purchase_headers').select('*').order('received_date', { ascending: false }),
    client.from('purchase_items').select('*').order('created_at', { ascending: true }),
    client.from('sale_headers').select('*').order('sold_at', { ascending: false }),
    client.from('sale_items').select('*').order('created_at', { ascending: true }),
  ]);

  if (brandsResult.error) {
    throwSupabaseReadError('Brands', brandsResult.error);
  }

  if (categoriesResult.error) {
    throwSupabaseReadError('Categories', categoriesResult.error);
  }

  if (variantsResult.error) {
    throwSupabaseReadError('Product variants', variantsResult.error);
  }

  if (suppliersResult.error) {
    throwSupabaseReadError('Suppliers', suppliersResult.error);
  }

  if (purchaseHeadersResult.error) {
    throwSupabaseReadError('Purchase headers', purchaseHeadersResult.error);
  }

  if (purchaseItemsResult.error) {
    throwSupabaseReadError('Purchase items', purchaseItemsResult.error);
  }

  if (saleHeadersResult.error) {
    throwSupabaseReadError('Sale headers', saleHeadersResult.error);
  }

  if (saleItemsResult.error) {
    throwSupabaseReadError('Sale items', saleItemsResult.error);
  }

  const salesItemsBySaleId = new Map<string, SaleItemRow[]>();
  const purchaseItemsByPurchaseId = new Map<string, PurchaseItemRow[]>();

  for (const row of (purchaseItemsResult.data ?? []) as PurchaseItemRow[]) {
    const currentRows = purchaseItemsByPurchaseId.get(row.purchase_id) ?? [];
    currentRows.push(row);
    purchaseItemsByPurchaseId.set(row.purchase_id, currentRows);
  }

  for (const row of (saleItemsResult.data ?? []) as SaleItemRow[]) {
    const saleId = String(row.sale_id);
    const currentRows = salesItemsBySaleId.get(saleId) ?? [];
    currentRows.push(row);
    salesItemsBySaleId.set(saleId, currentRows);
  }

  return {
    brands: ((brandsResult.data ?? []) as BrandRow[]).map(mapBrandRowToModel),
    categories: ((categoriesResult.data ?? []) as CategoryRow[]).map(mapCategoryRowToModel),
    products: productsResult,
    variants: ((variantsResult.data ?? []) as unknown as ProductVariantRow[]).map(
      mapVariantRowToModel,
    ),
    suppliers: ((suppliersResult.data ?? []) as SupplierRow[]).map(mapSupplierRowToModel),
    stockIns: ((purchaseHeadersResult.data ?? []) as PurchaseHeaderRow[]).map((row) =>
      mapPurchaseHeaderRowToModel(row, purchaseItemsByPurchaseId.get(row.id) ?? []),
    ),
    sales: ((saleHeadersResult.data ?? []) as SaleHeaderRow[]).map((row) =>
      mapSaleHeaderRowToModel(row, salesItemsBySaleId.get(String(row.id)) ?? []),
    ),
  };
}

export async function saveSupabaseBrand(brand: Brand): Promise<RemoteEntityResult<Brand>> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('brands')
      .upsert(mapBrandToRow(brand))
      .select()
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save the brand to Supabase: ${error.message}`);
    }

    return {
      ok: true,
      message: 'Brand saved successfully.',
      recordId: data.id,
      record: mapBrandRowToModel(data as BrandRow),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the brand to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function deleteSupabaseBrand(brandId: string): Promise<OperationResult> {
  try {
    const client = getClient();
    const { error } = await client.from('brands').delete().eq('id', brandId);

    if (error) {
      return buildRemoteFailure(`Could not delete the brand from Supabase: ${error.message}`);
    }

    return buildRemoteSuccess('Brand deleted successfully.', brandId);
  } catch (error) {
    return buildRemoteFailure(
      `Could not delete the brand from Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function saveSupabaseCategory(
  category: Category,
): Promise<RemoteEntityResult<Category>> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('categories')
      .upsert(mapCategoryToRow(category))
      .select()
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save the category to Supabase: ${error.message}`);
    }

    return {
      ok: true,
      message: 'Category saved successfully.',
      recordId: data.id,
      record: mapCategoryRowToModel(data as CategoryRow),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the category to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function deleteSupabaseCategory(categoryId: string): Promise<OperationResult> {
  try {
    const client = getClient();
    const { error } = await client.from('categories').delete().eq('id', categoryId);

    if (error) {
      return buildRemoteFailure(`Could not delete the category from Supabase: ${error.message}`);
    }

    return buildRemoteSuccess('Category deleted successfully.', categoryId);
  } catch (error) {
    return buildRemoteFailure(
      `Could not delete the category from Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function saveSupabaseProduct(product: Product): Promise<RemoteEntityResult<Product>> {
  try {
    const client = getClient();
    let lastError: SupabaseQueryError | null = null;

    for (const schema of getProductSchemaAttemptOrder()) {
      const { data, error } = await client
        .from('products')
        .upsert(mapProductToRow(product, schema))
        .select(schema.columns)
        .single();

      if (!error) {
        activeProductSchema = schema;
        const savedProduct = data as unknown as ProductRow;

        return {
          ok: true,
          message: 'Product saved successfully.',
          recordId: savedProduct.id,
          record: mapProductRowToModel(savedProduct, schema),
        };
      }

      lastError = error;

      if (!isSchemaMismatchError(error)) {
        break;
      }
    }

    return buildRemoteFailure(
      `Could not save the product to Supabase: ${
        buildSupabaseReadErrorMessage('Products', lastError ?? { message: 'Unknown product save error.' })
      }`,
    );
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
      .select(PRODUCT_VARIANT_COLUMNS)
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save the variant to Supabase: ${error.message}`);
    }

    const savedVariant = data as unknown as ProductVariantRow;

    return {
      ok: true,
      message: 'Variant saved successfully.',
      recordId: savedVariant.id,
      record: mapVariantRowToModel(savedVariant),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the variant to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
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

export async function saveSupabaseSupplier(
  supplier: Supplier,
): Promise<RemoteEntityResult<Supplier>> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('suppliers')
      .upsert(mapSupplierToRow(supplier))
      .select()
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save the supplier to Supabase: ${error.message}`);
    }

    return {
      ok: true,
      message: 'Supplier saved successfully.',
      recordId: data.id,
      record: mapSupplierRowToModel(data as SupplierRow),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the supplier to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function deleteSupabaseSupplier(supplierId: string): Promise<OperationResult> {
  try {
    const client = getClient();
    const { error } = await client.from('suppliers').delete().eq('id', supplierId);

    if (error) {
      return buildRemoteFailure(`Could not delete the supplier from Supabase: ${error.message}`);
    }

    return buildRemoteSuccess('Supplier deleted successfully.', supplierId);
  } catch (error) {
    return buildRemoteFailure(
      `Could not delete the supplier from Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function createSupabasePurchaseTransaction(
  stockIn: StockInRecord,
  updatedVariants: ProductVariant[],
): Promise<OperationResult> {
  try {
    const client = getClient();
    const userId = await getAuthenticatedUserId();
    const purchaseHeaderRow = mapPurchaseHeaderToRow(stockIn);
    const headerInsert = await insertSingleWithFallback(
      'purchase_headers',
      purchaseHeaderRow,
      userId,
    );

    if (headerInsert.error) {
      return buildRemoteFailure(
        buildTransactionInsertFailureMessage(
          'Could not save the purchase header to Supabase:',
          headerInsert.error,
          'supabase/transaction_schema_policy_repair.sql',
        ),
      );
    }

    const insertedPurchaseId = getInsertedRecordId(headerInsert.data) ?? stockIn.id;
    const purchaseItemRows = stockIn.items.map((item) =>
      mapPurchaseItemToRow(item, String(insertedPurchaseId), stockIn.createdAt),
    );
    const itemsInsert = await insertManyWithFallback(
      'purchase_items',
      purchaseItemRows,
      userId,
    );

    if (itemsInsert.error) {
      await rollbackInsertedPurchase(String(insertedPurchaseId));
      return buildRemoteFailure(
        buildTransactionInsertFailureMessage(
          'Could not save the purchase items to Supabase:',
          itemsInsert.error,
          'supabase/transaction_schema_policy_repair.sql',
        ),
      );
    }

    const variantRows = updatedVariants.map(mapVariantToRow);
    const variantsUpdate = await client.from('product_variants').upsert(variantRows);

    if (variantsUpdate.error) {
      await rollbackInsertedPurchase(String(insertedPurchaseId));
      return buildRemoteFailure(
        `Could not update stock in Supabase: ${variantsUpdate.error.message}`,
      );
    }

    return buildRemoteSuccess('Stock in saved successfully.', stockIn.id);
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the stock in transaction to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function createSupabaseSaleTransaction(
  sale: SaleRecord,
  updatedVariants: ProductVariant[],
): Promise<OperationResult> {
  try {
    const client = getClient();
    const userId = await getAuthenticatedUserId();
    const saleHeaderRow = mapSaleHeaderToRow(sale);
    let headerInsert = await insertSingleWithFallback('sale_headers', saleHeaderRow, userId);

    if (headerInsert.error && isLegacySaleHeaderInsertError(headerInsert.error)) {
      headerInsert = await insertSingleWithFallback(
        'sale_headers',
        { ...saleHeaderRow, sale_no: sale.receiptNo },
        userId,
      );
    }

    if (headerInsert.error && isLegacySaleHeaderInsertError(headerInsert.error)) {
      headerInsert = await insertSingleWithFallback(
        'sale_headers',
        mapSaleHeaderToLegacyRow(sale),
        userId,
      );
    }

    if (headerInsert.error) {
      return buildRemoteFailure(
        buildTransactionInsertFailureMessage(
          'Could not save the sale header to Supabase:',
          headerInsert.error,
          'supabase/sale_bigint_uuid_repair.sql',
        ),
      );
    }

    const insertedSaleId = getInsertedRecordId(headerInsert.data) ?? sale.id;
    const saleItemRows = sale.items.map((item) =>
      mapSaleItemToRow(item, String(insertedSaleId), sale.createdAt),
    );
    let itemsInsert = await insertManyWithFallback('sale_items', saleItemRows, userId);

    if (itemsInsert.error && isLegacySaleItemInsertError(itemsInsert.error)) {
      const legacySaleItemRows = sale.items.map((item) =>
        mapSaleItemToLegacyRow(item, String(insertedSaleId), sale.createdAt),
      );
      itemsInsert = await insertManyWithFallback('sale_items', legacySaleItemRows, userId);
    }

    if (itemsInsert.error) {
      await rollbackInsertedSale(String(insertedSaleId));
      return buildRemoteFailure(
        buildTransactionInsertFailureMessage(
          'Could not save the sale items to Supabase:',
          itemsInsert.error,
          'supabase/transaction_schema_policy_repair.sql',
        ),
      );
    }

    const variantRows = updatedVariants.map(mapVariantToRow);
    const variantsUpdate = await client.from('product_variants').upsert(variantRows);

    if (variantsUpdate.error) {
      await rollbackInsertedSale(String(insertedSaleId));
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
