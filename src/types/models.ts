export type Role = 'admin' | 'cashier';
export type EntityStatus = 'active' | 'inactive';
export type TargetGroup = 'men' | 'women' | 'unisex' | 'kids';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface TimestampedRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Brand extends TimestampedRecord {
  name: string;
  code: string;
  originCountry: string;
  status: EntityStatus;
}

export interface Category extends TimestampedRecord {
  name: string;
  code: string;
  description: string;
  status: EntityStatus;
}

export interface Product extends TimestampedRecord {
  name: string;
  styleCode: string;
  imageUrl?: string;
  brandId: string;
  categoryId: string;
  targetGroup: TargetGroup;
  basePrice: number;
  description: string;
  status: EntityStatus;
}

export interface ProductVariant extends TimestampedRecord {
  productId: string;
  sku: string;
  barcode?: string;
  size: string;
  color: string;
  sellingPrice: number;
  costPrice: number;
  stockQty: number;
  minStock: number;
  status: EntityStatus;
}

export interface Supplier extends TimestampedRecord {
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: EntityStatus;
}

export interface StockInItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  size: string;
  color: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface StockInRecord extends TimestampedRecord {
  referenceNo: string;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  receivedBy: string;
  note: string;
  items: StockInItem[];
  totalItems: number;
  totalQuantity: number;
  totalCost: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineCost: number;
  lineTotal: number;
  lineProfit: number;
}

export interface SaleRecord extends TimestampedRecord {
  receiptNo: string;
  soldAt: string;
  cashierId: string;
  cashierName: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  note: string;
  items: SaleItem[];
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
}

export interface InventoryState {
  brands: Brand[];
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  suppliers: Supplier[];
  stockIns: StockInRecord[];
  sales: SaleRecord[];
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AppUser extends TimestampedRecord {
  name: string;
  email: string;
  password: string;
  role: Role;
  status: EntityStatus;
}

export interface MockAccount extends AppUser {
}

export interface SystemSettings {
  storeName: string;
  branchName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  reportFooter: string;
}

export interface OperationResult {
  ok: boolean;
  message: string;
  recordId?: string;
}

export type BrandInput = Omit<Brand, keyof TimestampedRecord>;
export type CategoryInput = Omit<Category, keyof TimestampedRecord>;
export type ProductInput = Omit<Product, keyof TimestampedRecord>;
export type ProductVariantInput = Omit<ProductVariant, keyof TimestampedRecord>;
export type SupplierInput = Omit<Supplier, keyof TimestampedRecord>;
export type UserInput = Omit<AppUser, keyof TimestampedRecord>;
export type SystemSettingsInput = SystemSettings;

export interface StockInItemInput {
  variantId: string;
  quantity: number;
  unitCost: number;
}

export interface StockInInput {
  supplierId: string;
  referenceNo: string;
  receivedDate: string;
  receivedBy: string;
  note: string;
  items: StockInItemInput[];
}

export interface SaleItemInput {
  variantId: string;
  quantity: number;
}

export interface SaleInput {
  cashierId: string;
  cashierName: string;
  customerName?: string;
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  paidAmount: number;
  note: string;
  items: SaleItemInput[];
}
