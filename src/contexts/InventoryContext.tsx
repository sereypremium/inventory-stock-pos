import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { mockInventoryState } from '../data/mockData';
import { isSupabaseConfigured } from '../lib/supabase';
import { validateSupplierInput } from '../services/inventoryValidation';
import { createSaleTransaction } from '../services/salesService';
import { createStockInTransaction } from '../services/stockInService';
import {
  createSupabaseSaleTransaction,
  deleteSupabaseProduct,
  deleteSupabaseVariant,
  fetchSupabaseInventorySlices,
  saveSupabaseProduct,
  saveSupabaseVariant,
  saveSupabaseVariantsBatch,
} from '../services/supabaseInventory';
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
  dataSource: 'mock' | 'supabase';
  isDatabaseConnected: boolean;
  isSyncing: boolean;
  addBrand: (input: BrandInput) => Promise<OperationResult>;
  updateBrand: (brandId: string, input: BrandInput) => Promise<OperationResult>;
  deleteBrand: (brandId: string) => Promise<OperationResult>;
  addCategory: (input: CategoryInput) => Promise<OperationResult>;
  updateCategory: (categoryId: string, input: CategoryInput) => Promise<OperationResult>;
  deleteCategory: (categoryId: string) => Promise<OperationResult>;
  addProduct: (input: ProductInput) => Promise<OperationResult>;
  updateProduct: (productId: string, input: ProductInput) => Promise<OperationResult>;
  deleteProduct: (productId: string) => Promise<OperationResult>;
  addVariant: (input: ProductVariantInput) => Promise<OperationResult>;
  updateVariant: (variantId: string, input: ProductVariantInput) => Promise<OperationResult>;
  deleteVariant: (variantId: string) => Promise<OperationResult>;
  addSupplier: (input: SupplierInput) => Promise<OperationResult>;
  updateSupplier: (supplierId: string, input: SupplierInput) => Promise<OperationResult>;
  deleteSupplier: (supplierId: string) => Promise<OperationResult>;
  createStockIn: (input: StockInInput) => Promise<OperationResult>;
  createSale: (input: SaleInput) => Promise<OperationResult>;
}

const STORAGE_KEY = 'bootroom-pos.inventory-state';

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

function normalizeInventoryState(value?: Partial<InventoryState> | null): InventoryState {
  const hasStoredState = Boolean(value && Object.keys(value).length > 0);
  const mockProductsById = new Map(
    mockInventoryState.products.map((product) => [product.id, product]),
  );
  const mockVariantsById = new Map(
    mockInventoryState.variants.map((variant) => [variant.id, variant]),
  );
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
        totalAmount:
          sale.totalAmount ??
          Math.max((sale.subtotal ?? 0) - (sale.discountAmount ?? 0), 0),
        items: sale.items.map((item) => ({
          ...item,
          unitCost: item.unitCost ?? 0,
          lineCost: item.lineCost ?? 0,
          lineProfit: item.lineProfit ?? (item.lineTotal ?? 0) - (item.lineCost ?? 0),
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
  if (typeof window === 'undefined') {
    return;
  }

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
  const [dataSource, setDataSource] = useState<'mock' | 'supabase'>('mock');
  const [isSyncing, setIsSyncing] = useState(isSupabaseConfigured);

  const commitState = (updater: (current: InventoryState) => InventoryState) => {
    setState((current) => {
      const nextState = updater(current);
      persistState(nextState);
      return nextState;
    });
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setDataSource('mock');
      setIsSyncing(false);
      return;
    }

    let active = true;

    setIsSyncing(true);

    void fetchSupabaseInventorySlices()
      .then((remoteSlices) => {
        if (!active) {
          return;
        }

        commitState((current) =>
          normalizeInventoryState({
            ...current,
            products: remoteSlices.products,
            variants: remoteSlices.variants,
            sales: remoteSlices.sales,
          }),
        );
        setDataSource('supabase');
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setDataSource('mock');
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setIsSyncing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value: InventoryContextValue = {
    ...state,
    dataSource,
    isDatabaseConnected: dataSource === 'supabase',
    isSyncing,
    addBrand: async (input) => {
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
    updateBrand: async (brandId, input) => {
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
    deleteBrand: async (brandId) => {
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
    addCategory: async (input) => {
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
    updateCategory: async (categoryId, input) => {
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
    deleteCategory: async (categoryId) => {
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
    addProduct: async (input) => {
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

      let productToSave = nextProduct;

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseProduct(nextProduct);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        productToSave = remoteResult.record;
      }

      commitState((current) => ({
        ...current,
        products: [productToSave, ...current.products],
      }));

      return buildSuccess('Product saved successfully.');
    },
    updateProduct: async (productId, input) => {
      const styleExists = state.products.some(
        (product) =>
          product.id !== productId &&
          product.styleCode.toLowerCase() === input.styleCode.trim().toLowerCase(),
      );

      if (styleExists) {
        return buildFailure('Style code already exists.');
      }

      const existingProduct = state.products.find((product) => product.id === productId);

      if (!existingProduct) {
        return buildFailure('Product not found.');
      }

      let nextProduct: Product = {
        ...existingProduct,
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
      };

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseProduct(nextProduct);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        nextProduct = remoteResult.record;
      }

      commitState((current) => ({
        ...current,
        products: current.products.map((product) =>
          product.id === productId ? nextProduct : product,
        ),
      }));

      return buildSuccess('Product updated successfully.');
    },
    deleteProduct: async (productId) => {
      const variantCount = state.variants.filter((variant) => variant.productId === productId).length;

      if (variantCount > 0) {
        return buildFailure(
          'This product still has variants. Delete the variants first to avoid orphan stock.',
        );
      }

      if (dataSource === 'supabase') {
        const remoteResult = await deleteSupabaseProduct(productId);

        if (!remoteResult.ok) {
          return buildFailure(remoteResult.message);
        }
      }

      commitState((current) => ({
        ...current,
        products: current.products.filter((product) => product.id !== productId),
      }));

      return buildSuccess('Product deleted successfully.');
    },
    addVariant: async (input) => {
      const skuExists = state.variants.some(
        (variant) => variant.sku.toLowerCase() === input.sku.trim().toLowerCase(),
      );
      const normalizedBarcode = input.barcode?.trim().toLowerCase();
      const barcodeExists =
        Boolean(normalizedBarcode) &&
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
        return buildFailure(
          'This size and color combination already exists for the product.',
        );
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

      let variantToSave = nextVariant;

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseVariant(nextVariant);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        variantToSave = remoteResult.record;
      }

      commitState((current) => ({
        ...current,
        variants: [variantToSave, ...current.variants],
      }));

      return buildSuccess('Variant saved successfully.');
    },
    updateVariant: async (variantId, input) => {
      const skuExists = state.variants.some(
        (variant) =>
          variant.id !== variantId &&
          variant.sku.toLowerCase() === input.sku.trim().toLowerCase(),
      );
      const normalizedBarcode = input.barcode?.trim().toLowerCase();
      const barcodeExists =
        Boolean(normalizedBarcode) &&
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
        return buildFailure(
          'This size and color combination already exists for the product.',
        );
      }

      const existingVariant = state.variants.find((variant) => variant.id === variantId);

      if (!existingVariant) {
        return buildFailure('Variant not found.');
      }

      let nextVariant: ProductVariant = {
        ...existingVariant,
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
      };

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseVariant(nextVariant);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        nextVariant = remoteResult.record;
      }

      commitState((current) => ({
        ...current,
        variants: current.variants.map((variant) =>
          variant.id === variantId ? nextVariant : variant,
        ),
      }));

      return buildSuccess('Variant updated successfully.');
    },
    deleteVariant: async (variantId) => {
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

      if (dataSource === 'supabase') {
        const remoteResult = await deleteSupabaseVariant(variantId);

        if (!remoteResult.ok) {
          return buildFailure(remoteResult.message);
        }
      }

      commitState((current) => ({
        ...current,
        variants: current.variants.filter((variant) => variant.id !== variantId),
      }));

      return buildSuccess('Variant deleted successfully.');
    },
    addSupplier: async (input) => {
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
    updateSupplier: async (supplierId, input) => {
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
    deleteSupplier: async (supplierId) => {
      const stockInCount = state.stockIns.filter(
        (record) => record.supplierId === supplierId,
      ).length;

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
    createStockIn: async (input) => {
      const result = createStockInTransaction(state, input);

      if (!result.ok || !result.nextState) {
        return buildFailure(result.message);
      }

      if (dataSource === 'supabase') {
        const changedVariantIds = new Set(input.items.map((item) => item.variantId));
        const changedVariants = result.nextState.variants.filter((variant) =>
          changedVariantIds.has(variant.id),
        );
        const remoteResult = await saveSupabaseVariantsBatch(changedVariants);

        if (!remoteResult.ok) {
          return buildFailure(remoteResult.message);
        }
      }

      commitState(() => result.nextState!);

      return buildSuccess(result.message, result.recordId);
    },
    createSale: async (input) => {
      const result = createSaleTransaction(state, input);

      if (!result.ok || !result.nextState) {
        return buildFailure(result.message);
      }

      if (dataSource === 'supabase') {
        const sale = result.nextState.sales.find((entry) => entry.id === result.recordId);

        if (!sale) {
          return buildFailure('Sale was created locally but could not be prepared for Supabase.');
        }

        const changedVariantIds = new Set(sale.items.map((item) => item.variantId));
        const changedVariants = result.nextState.variants.filter((variant) =>
          changedVariantIds.has(variant.id),
        );
        const remoteResult = await createSupabaseSaleTransaction(sale, changedVariants);

        if (!remoteResult.ok) {
          return buildFailure(remoteResult.message);
        }
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
