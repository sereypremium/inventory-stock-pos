import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { mockInventoryState } from '../data/mockData';
import { validateSupplierInput } from '../services/inventoryValidation';
import { createSaleTransaction } from '../services/salesService';
import { createStockInTransaction } from '../services/stockInService';
import type {
  Brand,
  BrandInput,
  Category,
  CategoryInput,
  InventoryState,
  OperationResult,
  Product,
  ProductInput,
  ProductVariant,
  ProductVariantInput,
  SaleInput,
  StockInInput,
  Supplier,
  SupplierInput,
} from '../types/models';

interface InventoryContextValue extends InventoryState {
  addBrand: (input: BrandInput) => OperationResult;
  updateBrand: (brandId: string, input: BrandInput) => OperationResult;
  deleteBrand: (brandId: string) => OperationResult;
  addCategory: (input: CategoryInput) => OperationResult;
  updateCategory: (categoryId: string, input: CategoryInput) => OperationResult;
  deleteCategory: (categoryId: string) => OperationResult;
  addProduct: (input: ProductInput) => OperationResult;
  updateProduct: (productId: string, input: ProductInput) => OperationResult;
  deleteProduct: (productId: string) => OperationResult;
  addVariant: (input: ProductVariantInput) => OperationResult;
  updateVariant: (variantId: string, input: ProductVariantInput) => OperationResult;
  deleteVariant: (variantId: string) => OperationResult;
  addSupplier: (input: SupplierInput) => OperationResult;
  updateSupplier: (supplierId: string, input: SupplierInput) => OperationResult;
  deleteSupplier: (supplierId: string) => OperationResult;
  createStockIn: (input: StockInInput) => OperationResult;
  createSale: (input: SaleInput) => OperationResult;
}

const STORAGE_KEY = 'bootroom-pos.inventory-state';

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

function normalizeInventoryState(value?: Partial<InventoryState> | null): InventoryState {
  const hasStoredState = Boolean(value && Object.keys(value).length > 0);
  const mockProductsById = new Map(mockInventoryState.products.map((product) => [product.id, product]));
  const mockVariantsById = new Map(mockInventoryState.variants.map((variant) => [variant.id, variant]));
  const normalizedProducts = Array.isArray(value?.products)
    ? value.products.map((product) => ({
        ...product,
        imageUrl: product.imageUrl ?? mockProductsById.get(product.id)?.imageUrl ?? '',
      }))
    : mockInventoryState.products;
  const normalizedVariants = Array.isArray(value?.variants)
    ? value.variants.map((variant) => ({
        ...variant,
        barcode: variant.barcode ?? mockVariantsById.get(variant.id)?.barcode ?? '',
      }))
    : mockInventoryState.variants;
  const normalizedSales = Array.isArray(value?.sales)
    ? value.sales.map((sale) => ({
        ...sale,
        customerName: sale.customerName ?? '',
        discountAmount: sale.discountAmount ?? 0,
        totalAmount: sale.totalAmount ?? Math.max((sale.subtotal ?? 0) - (sale.discountAmount ?? 0), 0),
        items: sale.items.map((item) => ({
          ...item,
          unitCost: item.unitCost ?? 0,
          lineCost: item.lineCost ?? 0,
          lineProfit: item.lineProfit ?? ((item.lineTotal ?? 0) - (item.lineCost ?? 0)),
        })),
      }))
    : hasStoredState
      ? []
      : mockInventoryState.sales;

  return {
    brands: Array.isArray(value?.brands) ? value.brands : mockInventoryState.brands,
    categories: Array.isArray(value?.categories) ? value.categories : mockInventoryState.categories,
    products: normalizedProducts,
    variants: normalizedVariants,
    suppliers: Array.isArray(value?.suppliers)
      ? value.suppliers
      : hasStoredState
        ? []
        : mockInventoryState.suppliers,
    stockIns: Array.isArray(value?.stockIns)
      ? value.stockIns
      : hasStoredState
        ? []
        : mockInventoryState.stockIns,
    sales: normalizedSales,
  };
}

function getInitialState() {
  if (typeof window === 'undefined') {
    return mockInventoryState;
  }

  const storedState = localStorage.getItem(STORAGE_KEY);

  if (!storedState) {
    return mockInventoryState;
  }

  try {
    return normalizeInventoryState(JSON.parse(storedState) as Partial<InventoryState>);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return mockInventoryState;
  }
}

function persistState(state: InventoryState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createTimestamps() {
  const now = new Date().toISOString();

  return {
    createdAt: now,
    updatedAt: now,
  };
}

function buildSuccess(message: string, recordId?: string): OperationResult {
  return { ok: true, message, recordId };
}

function buildFailure(message: string): OperationResult {
  return { ok: false, message };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(() => getInitialState());

  const commitState = (updater: (current: InventoryState) => InventoryState) => {
    setState((current) => {
      const nextState = updater(current);
      persistState(nextState);
      return nextState;
    });
  };

  const value: InventoryContextValue = {
    ...state,
    addBrand: (input) => {
      const exists = state.brands.some(
        (brand) => brand.code.toLowerCase() === input.code.trim().toLowerCase(),
      );

      if (exists) {
        return buildFailure('Brand code already exists.');
      }

      const nextBrand: Brand = {
        id: crypto.randomUUID(),
        ...createTimestamps(),
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        originCountry: input.originCountry.trim(),
        status: input.status,
      };

      commitState((current) => ({
        ...current,
        brands: [nextBrand, ...current.brands],
      }));

      return buildSuccess('Brand saved successfully.');
    },
    updateBrand: (brandId, input) => {
      const duplicate = state.brands.some(
        (brand) =>
          brand.id !== brandId &&
          brand.code.toLowerCase() === input.code.trim().toLowerCase(),
      );

      if (duplicate) {
        return buildFailure('Brand code already exists.');
      }

      commitState((current) => ({
        ...current,
        brands: current.brands.map((brand) =>
          brand.id === brandId
            ? {
                ...brand,
                name: input.name.trim(),
                code: input.code.trim().toUpperCase(),
                originCountry: input.originCountry.trim(),
                status: input.status,
                updatedAt: new Date().toISOString(),
              }
            : brand,
        ),
      }));

      return buildSuccess('Brand updated successfully.');
    },
    deleteBrand: (brandId) => {
      const productCount = state.products.filter((product) => product.brandId === brandId).length;

      if (productCount > 0) {
        return buildFailure(
          'This brand is already used by products. Remove or reassign those products first.',
        );
      }

      commitState((current) => ({
        ...current,
        brands: current.brands.filter((brand) => brand.id !== brandId),
      }));

      return buildSuccess('Brand deleted successfully.');
    },
    addCategory: (input) => {
      const exists = state.categories.some(
        (category) => category.code.toLowerCase() === input.code.trim().toLowerCase(),
      );

      if (exists) {
        return buildFailure('Category code already exists.');
      }

      const nextCategory: Category = {
        id: crypto.randomUUID(),
        ...createTimestamps(),
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        description: input.description.trim(),
        status: input.status,
      };

      commitState((current) => ({
        ...current,
        categories: [nextCategory, ...current.categories],
      }));

      return buildSuccess('Category saved successfully.');
    },
    updateCategory: (categoryId, input) => {
      const duplicate = state.categories.some(
        (category) =>
          category.id !== categoryId &&
          category.code.toLowerCase() === input.code.trim().toLowerCase(),
      );

      if (duplicate) {
        return buildFailure('Category code already exists.');
      }

      commitState((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                name: input.name.trim(),
                code: input.code.trim().toUpperCase(),
                description: input.description.trim(),
                status: input.status,
                updatedAt: new Date().toISOString(),
              }
            : category,
        ),
      }));

      return buildSuccess('Category updated successfully.');
    },
    deleteCategory: (categoryId) => {
      const productCount = state.products.filter(
        (product) => product.categoryId === categoryId,
      ).length;

      if (productCount > 0) {
        return buildFailure(
          'This category is already assigned to products. Remove or reassign those products first.',
        );
      }

      commitState((current) => ({
        ...current,
        categories: current.categories.filter((category) => category.id !== categoryId),
      }));

      return buildSuccess('Category deleted successfully.');
    },
    addProduct: (input) => {
      const styleExists = state.products.some(
        (product) => product.styleCode.toLowerCase() === input.styleCode.trim().toLowerCase(),
      );

      if (styleExists) {
        return buildFailure('Style code already exists.');
      }

      const brandExists = state.brands.some((brand) => brand.id === input.brandId);
      const categoryExists = state.categories.some((category) => category.id === input.categoryId);

      if (!brandExists || !categoryExists) {
        return buildFailure('Select a valid brand and category before saving the product.');
      }

      const nextProduct: Product = {
        id: crypto.randomUUID(),
        ...createTimestamps(),
        name: input.name.trim(),
        styleCode: input.styleCode.trim().toUpperCase(),
        imageUrl: input.imageUrl?.trim() || '',
        brandId: input.brandId,
        categoryId: input.categoryId,
        targetGroup: input.targetGroup,
        basePrice: Number(input.basePrice),
        description: input.description.trim(),
        status: input.status,
      };

      commitState((current) => ({
        ...current,
        products: [nextProduct, ...current.products],
      }));

      return buildSuccess('Product saved successfully.');
    },
    updateProduct: (productId, input) => {
      const styleExists = state.products.some(
        (product) =>
          product.id !== productId &&
          product.styleCode.toLowerCase() === input.styleCode.trim().toLowerCase(),
      );

      if (styleExists) {
        return buildFailure('Style code already exists.');
      }

      commitState((current) => ({
        ...current,
        products: current.products.map((product) =>
          product.id === productId
            ? {
                ...product,
                name: input.name.trim(),
                styleCode: input.styleCode.trim().toUpperCase(),
                imageUrl: input.imageUrl?.trim() || '',
                brandId: input.brandId,
                categoryId: input.categoryId,
                targetGroup: input.targetGroup,
                basePrice: Number(input.basePrice),
                description: input.description.trim(),
                status: input.status,
                updatedAt: new Date().toISOString(),
              }
            : product,
        ),
      }));

      return buildSuccess('Product updated successfully.');
    },
    deleteProduct: (productId) => {
      const variantCount = state.variants.filter((variant) => variant.productId === productId).length;

      if (variantCount > 0) {
        return buildFailure(
          'This product still has variants. Delete the variants first to avoid orphan stock.',
        );
      }

      commitState((current) => ({
        ...current,
        products: current.products.filter((product) => product.id !== productId),
      }));

      return buildSuccess('Product deleted successfully.');
    },
    addVariant: (input) => {
      const skuExists = state.variants.some(
        (variant) => variant.sku.toLowerCase() === input.sku.trim().toLowerCase(),
      );
      const normalizedBarcode = input.barcode?.trim().toLowerCase();
      const barcodeExists = Boolean(normalizedBarcode) &&
        state.variants.some(
          (variant) => variant.barcode?.trim().toLowerCase() === normalizedBarcode,
        );
      const combinationExists = state.variants.some(
        (variant) =>
          variant.productId === input.productId &&
          variant.size.trim() === input.size.trim() &&
          variant.color.trim().toLowerCase() === input.color.trim().toLowerCase(),
      );

      if (skuExists) {
        return buildFailure('Variant SKU already exists.');
      }

      if (barcodeExists) {
        return buildFailure('Variant barcode already exists.');
      }

      if (combinationExists) {
        return buildFailure('This size and color combination already exists for the product.');
      }

      const productExists = state.products.some((product) => product.id === input.productId);

      if (!productExists) {
        return buildFailure('Select a valid product before saving the variant.');
      }

      const nextVariant: ProductVariant = {
        id: crypto.randomUUID(),
        ...createTimestamps(),
        productId: input.productId,
        sku: input.sku.trim().toUpperCase(),
        barcode: input.barcode?.trim() || '',
        size: input.size.trim(),
        color: input.color.trim(),
        sellingPrice: Number(input.sellingPrice),
        costPrice: Number(input.costPrice),
        stockQty: Number(input.stockQty),
        minStock: Number(input.minStock),
        status: input.status,
      };

      commitState((current) => ({
        ...current,
        variants: [nextVariant, ...current.variants],
      }));

      return buildSuccess('Variant saved successfully.');
    },
    updateVariant: (variantId, input) => {
      const skuExists = state.variants.some(
        (variant) =>
          variant.id !== variantId &&
          variant.sku.toLowerCase() === input.sku.trim().toLowerCase(),
      );
      const normalizedBarcode = input.barcode?.trim().toLowerCase();
      const barcodeExists = Boolean(normalizedBarcode) &&
        state.variants.some(
          (variant) =>
            variant.id !== variantId &&
            variant.barcode?.trim().toLowerCase() === normalizedBarcode,
        );
      const combinationExists = state.variants.some(
        (variant) =>
          variant.id !== variantId &&
          variant.productId === input.productId &&
          variant.size.trim() === input.size.trim() &&
          variant.color.trim().toLowerCase() === input.color.trim().toLowerCase(),
      );

      if (skuExists) {
        return buildFailure('Variant SKU already exists.');
      }

      if (barcodeExists) {
        return buildFailure('Variant barcode already exists.');
      }

      if (combinationExists) {
        return buildFailure('This size and color combination already exists for the product.');
      }

      commitState((current) => ({
        ...current,
        variants: current.variants.map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
              productId: input.productId,
              sku: input.sku.trim().toUpperCase(),
              barcode: input.barcode?.trim() || '',
              size: input.size.trim(),
              color: input.color.trim(),
              sellingPrice: Number(input.sellingPrice),
                costPrice: Number(input.costPrice),
                stockQty: Number(input.stockQty),
                minStock: Number(input.minStock),
                status: input.status,
                updatedAt: new Date().toISOString(),
              }
            : variant,
        ),
      }));

      return buildSuccess('Variant updated successfully.');
    },
    deleteVariant: (variantId) => {
      const stockInCount = state.stockIns.filter((record) =>
        record.items.some((item) => item.variantId === variantId),
      ).length;
      const salesCount = state.sales.filter((record) =>
        record.items.some((item) => item.variantId === variantId),
      ).length;

      if (stockInCount > 0) {
        return buildFailure(
          'This variant has stock in history. Keep it for inventory traceability.',
        );
      }

      if (salesCount > 0) {
        return buildFailure(
          'This variant has sales history. Keep it for receipt and stock traceability.',
        );
      }

      commitState((current) => ({
        ...current,
        variants: current.variants.filter((variant) => variant.id !== variantId),
      }));

      return buildSuccess('Variant deleted successfully.');
    },
    addSupplier: (input) => {
      const validationMessage = validateSupplierInput(input);

      if (validationMessage) {
        return buildFailure(validationMessage);
      }

      const exists = state.suppliers.some(
        (supplier) => supplier.code.toLowerCase() === input.code.trim().toLowerCase(),
      );

      if (exists) {
        return buildFailure('Supplier code already exists.');
      }

      const nextSupplier: Supplier = {
        id: crypto.randomUUID(),
        ...createTimestamps(),
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        contactPerson: input.contactPerson.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        address: input.address.trim(),
        status: input.status,
      };

      commitState((current) => ({
        ...current,
        suppliers: [nextSupplier, ...current.suppliers],
      }));

      return buildSuccess('Supplier saved successfully.');
    },
    updateSupplier: (supplierId, input) => {
      const validationMessage = validateSupplierInput(input);

      if (validationMessage) {
        return buildFailure(validationMessage);
      }

      const duplicate = state.suppliers.some(
        (supplier) =>
          supplier.id !== supplierId &&
          supplier.code.toLowerCase() === input.code.trim().toLowerCase(),
      );

      if (duplicate) {
        return buildFailure('Supplier code already exists.');
      }

      commitState((current) => ({
        ...current,
        suppliers: current.suppliers.map((supplier) =>
          supplier.id === supplierId
            ? {
                ...supplier,
                name: input.name.trim(),
                code: input.code.trim().toUpperCase(),
                contactPerson: input.contactPerson.trim(),
                phone: input.phone.trim(),
                email: input.email.trim().toLowerCase(),
                address: input.address.trim(),
                status: input.status,
                updatedAt: new Date().toISOString(),
              }
            : supplier,
        ),
      }));

      return buildSuccess('Supplier updated successfully.');
    },
    deleteSupplier: (supplierId) => {
      const stockInCount = state.stockIns.filter((record) => record.supplierId === supplierId).length;

      if (stockInCount > 0) {
        return buildFailure(
          'This supplier already has stock in transactions. Keep it for purchasing history.',
        );
      }

      commitState((current) => ({
        ...current,
        suppliers: current.suppliers.filter((supplier) => supplier.id !== supplierId),
      }));

      return buildSuccess('Supplier deleted successfully.');
    },
    createStockIn: (input) => {
      const result = createStockInTransaction(state, input);

      if (!result.ok || !result.nextState) {
        return buildFailure(result.message);
      }

      commitState(() => result.nextState!);

      return buildSuccess(result.message, result.recordId);
    },
    createSale: (input) => {
      const result = createSaleTransaction(state, input);

      if (!result.ok || !result.nextState) {
        return buildFailure(result.message);
      }

      commitState(() => result.nextState!);

      return buildSuccess(result.message, result.recordId);
    },
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
