export type Role = 'admin' | 'cashier';
export type EntityStatus = 'active' | 'inactive';
export type Gender = 'men' | 'women' | 'unisex' | 'kids';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'e_wallet';
export type StockMovementType = 'stock_in' | 'sale';
export type StockReferenceType = 'purchase' | 'sale';

export interface CreatedRecord {
  id: string;
  created_at: string;
}

export interface TimestampedRecord extends CreatedRecord {
  updated_at: string;
}

export interface Brand extends TimestampedRecord {
  name: string;
  description: string;
  status: EntityStatus;
}

export interface Category extends TimestampedRecord {
  name: string;
  description: string;
  status: EntityStatus;
}

export interface Supplier extends TimestampedRecord {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: EntityStatus;
}

export interface Customer extends TimestampedRecord {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: EntityStatus;
}

export interface Profile extends TimestampedRecord {
  full_name: string;
  role: Role;
  status: EntityStatus;
}

export interface MockAccount extends Profile {
  email: string;
  password: string;
}

export interface Product extends TimestampedRecord {
  product_code: string;
  brand_id: string;
  category_id: string;
  model_name: string;
  gender: Gender;
  description: string;
  image_url: string;
  status: EntityStatus;
}

export interface ProductVariant extends TimestampedRecord {
  product_id: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  cost_price: number;
  sale_price: number;
  stock_qty: number;
  min_stock_qty: number;
  status: EntityStatus;
}

export interface PurchaseHeader extends TimestampedRecord {
  purchase_no: string;
  supplier_id: string;
  purchase_date: string;
  total_qty: number;
  total_amount: number;
  notes: string;
  created_by: string;
}

export interface PurchaseItem extends CreatedRecord {
  purchase_id: string;
  product_variant_id: string;
  qty: number;
  cost_price: number;
  line_total: number;
}

export interface SaleHeader extends TimestampedRecord {
  sale_no: string;
  sale_date: string;
  customer_id: string | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: PaymentMethod;
  notes: string;
  created_by: string;
}

export interface SaleItem extends CreatedRecord {
  sale_id: string;
  product_variant_id: string;
  qty: number;
  cost_price: number;
  sale_price: number;
  discount_amount: number;
  line_total: number;
}

export interface StockMovement extends CreatedRecord {
  movement_date: string;
  product_variant_id: string;
  movement_type: StockMovementType;
  reference_type: StockReferenceType;
  reference_id: string;
  qty_in: number;
  qty_out: number;
  balance_after: number;
  notes: string;
  created_by: string;
}

export interface ShopSettings extends TimestampedRecord {
  shop_name: string;
  shop_logo_url: string;
  phone: string;
  address: string;
  currency: string;
  receipt_footer: string;
  theme_color: string;
}

export interface InventoryState {
  brands: Brand[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  profiles: MockAccount[];
  products: Product[];
  product_variants: ProductVariant[];
  purchase_headers: PurchaseHeader[];
  purchase_items: PurchaseItem[];
  sale_headers: SaleHeader[];
  sale_items: SaleItem[];
  stock_movements: StockMovement[];
  settings: ShopSettings;
}

export interface UserSession {
  id: string;
  full_name: string;
  email: string;
  role: Role;
}

export interface OperationResult {
  ok: boolean;
  message: string;
  record_id?: string;
}

export interface StateOperationResult extends OperationResult {
  state?: InventoryState;
}

export type BrandInput = Omit<Brand, keyof TimestampedRecord>;
export type CategoryInput = Omit<Category, keyof TimestampedRecord>;
export type SupplierInput = Omit<Supplier, keyof TimestampedRecord>;
export type CustomerInput = Omit<Customer, keyof TimestampedRecord>;
export type ProductInput = Omit<Product, keyof TimestampedRecord>;
export type ProductVariantInput = Omit<ProductVariant, keyof TimestampedRecord>;
export type ShopSettingsInput = Omit<ShopSettings, keyof TimestampedRecord | 'id'>;
export type UserInput = Omit<MockAccount, keyof TimestampedRecord | 'id'>;

export interface StockInItemInput {
  product_variant_id: string;
  qty: number;
  cost_price: number;
}

export interface StockInInput {
  supplier_id: string;
  purchase_date: string;
  notes: string;
  created_by: string;
  items: StockInItemInput[];
}

export interface SaleItemInput {
  product_variant_id: string;
  qty: number;
  sale_price: number;
  discount_amount: number;
}

export interface SaleInput {
  sale_date: string;
  customer_id: string | null;
  discount_amount: number;
  paid_amount: number;
  payment_method: PaymentMethod;
  notes: string;
  created_by: string;
  items: SaleItemInput[];
}
