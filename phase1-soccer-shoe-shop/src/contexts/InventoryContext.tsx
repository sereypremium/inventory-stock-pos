import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { create_brand, delete_brand, update_brand } from '../services/brandService';
import { load_catalog_state, save_catalog_state } from '../services/catalogStore';
import { create_category, delete_category, update_category } from '../services/categoryService';
import { create_customer, delete_customer, update_customer } from '../services/customerService';
import {
  create_product,
  create_product_variant,
  delete_product,
  delete_product_variant,
  update_product,
  update_product_variant,
} from '../services/productService';
import { create_sale_transaction } from '../services/salesService';
import {
  create_user_profile,
  delete_user_profile,
  update_shop_settings,
  update_user_profile,
} from '../services/settingsService';
import { create_purchase_transaction } from '../services/stockInService';
import { create_supplier, delete_supplier, update_supplier } from '../services/supplierService';
import type {
  BrandInput,
  CategoryInput,
  CustomerInput,
  InventoryState,
  OperationResult,
  ProductInput,
  ProductVariantInput,
  SaleInput,
  ShopSettingsInput,
  StateOperationResult,
  StockInInput,
  SupplierInput,
  UserInput,
} from '../types/models';

interface InventoryContextValue extends InventoryState {
  add_brand: (input: BrandInput) => OperationResult;
  update_brand: (brand_id: string, input: BrandInput) => OperationResult;
  delete_brand: (brand_id: string) => OperationResult;
  add_category: (input: CategoryInput) => OperationResult;
  update_category: (category_id: string, input: CategoryInput) => OperationResult;
  delete_category: (category_id: string) => OperationResult;
  add_supplier: (input: SupplierInput) => OperationResult;
  update_supplier: (supplier_id: string, input: SupplierInput) => OperationResult;
  delete_supplier: (supplier_id: string) => OperationResult;
  add_customer: (input: CustomerInput) => OperationResult;
  update_customer: (customer_id: string, input: CustomerInput) => OperationResult;
  delete_customer: (customer_id: string) => OperationResult;
  add_product: (input: ProductInput) => OperationResult;
  update_product: (product_id: string, input: ProductInput) => OperationResult;
  delete_product: (product_id: string) => OperationResult;
  add_product_variant: (input: ProductVariantInput) => OperationResult;
  update_product_variant: (variant_id: string, input: ProductVariantInput) => OperationResult;
  delete_product_variant: (variant_id: string) => OperationResult;
  create_stock_in: (input: StockInInput) => OperationResult;
  create_sale: (input: SaleInput) => OperationResult;
  update_settings: (input: ShopSettingsInput) => OperationResult;
  add_user: (input: UserInput) => OperationResult;
  update_user: (user_id: string, input: UserInput) => OperationResult;
  delete_user: (user_id: string) => OperationResult;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(() => load_catalog_state());

  const commit_result = (result: StateOperationResult) => {
    if (!result.ok || !result.state) {
      return { ok: false, message: result.message };
    }

    save_catalog_state(result.state);
    setState(result.state);

    return {
      ok: true,
      message: result.message,
      record_id: result.record_id,
    };
  };

  const value: InventoryContextValue = {
    ...state,
    add_brand: (input) => commit_result(create_brand(state, input)),
    update_brand: (brand_id, input) => commit_result(update_brand(state, brand_id, input)),
    delete_brand: (brand_id) => commit_result(delete_brand(state, brand_id)),
    add_category: (input) => commit_result(create_category(state, input)),
    update_category: (category_id, input) =>
      commit_result(update_category(state, category_id, input)),
    delete_category: (category_id) => commit_result(delete_category(state, category_id)),
    add_supplier: (input) => commit_result(create_supplier(state, input)),
    update_supplier: (supplier_id, input) =>
      commit_result(update_supplier(state, supplier_id, input)),
    delete_supplier: (supplier_id) => commit_result(delete_supplier(state, supplier_id)),
    add_customer: (input) => commit_result(create_customer(state, input)),
    update_customer: (customer_id, input) =>
      commit_result(update_customer(state, customer_id, input)),
    delete_customer: (customer_id) => commit_result(delete_customer(state, customer_id)),
    add_product: (input) => commit_result(create_product(state, input)),
    update_product: (product_id, input) =>
      commit_result(update_product(state, product_id, input)),
    delete_product: (product_id) => commit_result(delete_product(state, product_id)),
    add_product_variant: (input) => commit_result(create_product_variant(state, input)),
    update_product_variant: (variant_id, input) =>
      commit_result(update_product_variant(state, variant_id, input)),
    delete_product_variant: (variant_id) =>
      commit_result(delete_product_variant(state, variant_id)),
    create_stock_in: (input) => commit_result(create_purchase_transaction(state, input)),
    create_sale: (input) => commit_result(create_sale_transaction(state, input)),
    update_settings: (input) => commit_result(update_shop_settings(state, input)),
    add_user: (input) => commit_result(create_user_profile(state, input)),
    update_user: (user_id, input) => commit_result(update_user_profile(state, user_id, input)),
    delete_user: (user_id) => commit_result(delete_user_profile(state, user_id)),
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);

  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }

  return context;
}
