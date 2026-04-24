import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { mockInventoryState } from '../data/mockData';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { validateSupplierInput } from '../services/inventoryValidation';
import { createSaleTransaction } from '../services/salesService';
import { createStockInTransaction } from '../services/stockInService';
import {
  createSupabasePurchaseTransaction,
  createSupabaseSaleTransaction,
  deleteSupabaseBrand,
  deleteSupabaseCategory,
  deleteSupabaseSupplier,
  deleteSupabaseProduct,
  deleteSupabaseVariant,
  fetchSupabaseInventorySlices,
  saveSupabaseBrand,
  saveSupabaseCategory,
  saveSupabaseProduct,
  saveSupabaseSupplier,
  saveSupabaseVariant,
  SupabaseInventoryError,
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
  inventorySyncError: InventorySyncError | null;
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

type InventorySyncErrorKind = 'permission' | 'query' | 'schema' | 'unknown';

interface InventorySyncError {
  kind: InventorySyncErrorKind;
  message: string;
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
        imageUrl: variant.imageUrl ?? mockVariantsById.get(variant.id)?.imageUrl ?? '',
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

function createSupabaseBootState(baseState: InventoryState): InventoryState {
  return {
    ...baseState,
    brands: [],
    categories: [],
    products: [],
    variants: [],
    suppliers: [],
    stockIns: [],
    sales: [],
  };
}

function getInitialState() {
  const fallbackState = isSupabaseConfigured
    ? createSupabaseBootState(normalizeInventoryState())
    : mockInventoryState;

  if (typeof window === 'undefined') {
    return fallbackState;
  }

  const storedState = localStorage.getItem(STORAGE_KEY);

  if (!storedState) {
    return fallbackState;
  }

  try {
    const normalizedState = normalizeInventoryState(JSON.parse(storedState) as Partial<InventoryState>);
    return isSupabaseConfigured ? createSupabaseBootState(normalizedState) : normalizedState;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return fallbackState;
  }
}

function persistState(state: InventoryState) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not persist inventory state to browser storage.', error);
  }
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

function formatError(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown inventory sync error.';
}

function classifyInventorySyncError(error: unknown): InventorySyncError {
  const message = formatError(error);
  const lowerMessage = message.toLowerCase();

  if (error instanceof SupabaseInventoryError && error.code === '42501') {
    return { kind: 'permission', message };
  }

  if (error instanceof SupabaseInventoryError && error.code === '42703') {
    return { kind: 'schema', message };
  }

  if (
    lowerMessage.includes('schema cache') ||
    lowerMessage.includes('column') ||
    lowerMessage.includes('relation') ||
    lowerMessage.includes('table') ||
    lowerMessage.includes('does not exist') ||
    lowerMessage.includes('42703') ||
    lowerMessage.includes('42p01') ||
    lowerMessage.includes('pgrst204')
  ) {
    return { kind: 'schema', message };
  }

  if (
    lowerMessage.includes('parse') ||
    lowerMessage.includes('order') ||
    lowerMessage.includes('syntax') ||
    lowerMessage.includes('bad request') ||
    lowerMessage.includes('pgrst100') ||
    lowerMessage.includes('400')
  ) {
    return { kind: 'query', message };
  }

  return { kind: 'unknown', message };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { authStatus, session } = useAuth();
  const [state, setState] = useState<InventoryState>(() => getInitialState());
  const [dataSource, setDataSource] = useState<'mock' | 'supabase'>(
    isSupabaseConfigured ? 'supabase' : 'mock',
  );
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(isSupabaseConfigured);
  const [inventorySyncError, setInventorySyncError] = useState<InventorySyncError | null>(null);

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
      setIsDatabaseConnected(false);
      setIsSyncing(false);
      setInventorySyncError(null);
      return;
    }

    setDataSource('supabase');

    if (authStatus === 'loading') {
      setIsDatabaseConnected(false);
      setIsSyncing(true);
      setInventorySyncError(null);
      return;
    }

    if (!session) {
      commitState((current) => createSupabaseBootState(current));
      setIsDatabaseConnected(false);
      setIsSyncing(false);
      setInventorySyncError(null);
      return;
    }

    let active = true;

    setIsSyncing(true);
    setInventorySyncError(null);

    void fetchSupabaseInventorySlices()
      .then((remoteSlices) => {
        if (!active) {
          return;
        }

        commitState((current) =>
          normalizeInventoryState({
            ...current,
            brands: remoteSlices.brands,
            categories: remoteSlices.categories,
            products: remoteSlices.products,
            variants: remoteSlices.variants,
            suppliers: remoteSlices.suppliers,
            stockIns: remoteSlices.stockIns,
            sales: remoteSlices.sales,
          }),
        );
        setIsDatabaseConnected(true);
        setInventorySyncError(null);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        const syncError = classifyInventorySyncError(error);
        console.error('Supabase inventory sync failed.', {
          kind: syncError.kind,
          message: syncError.message,
          error,
        });
        commitState((current) => createSupabaseBootState(current));
        setIsDatabaseConnected(false);
        setInventorySyncError(syncError);
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
  }, [authStatus, session?.id]);

  const value: InventoryContextValue = {
    ...state,
    dataSource,
    isDatabaseConnected,
    isSyncing,
    inventorySyncError,
    addBrand: async (input) => {
      const exists = state.brands.some(
        (brand) => brand.code.toLowerCase() === input.code.trim().toLowerCase(),
      );

      if (exists) {
        return buildFailure('Brand code already exists.');
      }

      let nextBrand: Brand = {
        id: crypto.randomUUID(),
        ...createTimestamps(),
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        originCountry: input.originCountry.trim(),
        status: input.status,
      };

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseBrand(nextBrand);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        nextBrand = remoteResult.record;
      }

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

      const existingBrand = state.brands.find((brand) => brand.id === brandId);

      if (!existingBrand) {
        return buildFailure('Brand not found.');
      }

      let nextBrand: Brand = {
        ...existingBrand,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        originCountry: input.originCountry.trim(),
        status: input.status,
        updatedAt: new Date().toISOString(),
      };

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseBrand(nextBrand);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        nextBrand = remoteResult.record;
      }

      commitState((current) => ({
        ...current,
        brands: current.brands.map((brand) =>
          brand.id === brandId ? nextBrand : brand,
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

      if (dataSource === 'supabase') {
        const remoteResult = await deleteSupabaseBrand(brandId);

        if (!remoteResult.ok) {
          return buildFailure(remoteResult.message);
        }
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

      let nextCategory: Category = {
        id: crypto.randomUUID(),
        ...createTimestamps(),
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        description: input.description.trim(),
        status: input.status,
      };

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseCategory(nextCategory);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        nextCategory = remoteResult.record;
      }

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

      const existingCategory = state.categories.find((category) => category.id === categoryId);

      if (!existingCategory) {
        return buildFailure('Category not found.');
      }

      let nextCategory: Category = {
        ...existingCategory,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        description: input.description.trim(),
        status: input.status,
        updatedAt: new Date().toISOString(),
      };

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseCategory(nextCategory);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        nextCategory = remoteResult.record;
      }

      commitState((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId ? nextCategory : category,
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

      if (dataSource === 'supabase') {
        const remoteResult = await deleteSupabaseCategory(categoryId);

        if (!remoteResult.ok) {
          return buildFailure(remoteResult.message);
        }
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
        imageUrl: input.imageUrl?.trim() || '',
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
        imageUrl: input.imageUrl?.trim() || '',
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

      let nextSupplier: Supplier = {
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

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseSupplier(nextSupplier);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        nextSupplier = remoteResult.record;
      }

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

      const currentSupplier = state.suppliers.find((supplier) => supplier.id === supplierId);

      if (!currentSupplier) {
        return buildFailure('Supplier could not be found.');
      }

      let nextSupplier: Supplier = {
        ...currentSupplier,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        contactPerson: input.contactPerson.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        address: input.address.trim(),
        status: input.status,
        updatedAt: new Date().toISOString(),
      };

      if (dataSource === 'supabase') {
        const remoteResult = await saveSupabaseSupplier(nextSupplier);

        if (!remoteResult.ok || !remoteResult.record) {
          return buildFailure(remoteResult.message);
        }

        nextSupplier = remoteResult.record;
      }

      commitState((current) => ({
        ...current,
        suppliers: current.suppliers.map((supplier) =>
          supplier.id === supplierId ? nextSupplier : supplier,
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

      if (dataSource === 'supabase') {
        const remoteResult = await deleteSupabaseSupplier(supplierId);

        if (!remoteResult.ok) {
          return buildFailure(remoteResult.message);
        }
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
        const stockIn = result.nextState.stockIns.find((entry) => entry.id === result.recordId);

        if (!stockIn) {
          return buildFailure(
            'Stock in was created locally but could not be prepared for Supabase.',
          );
        }

        const changedVariantIds = new Set(input.items.map((item) => item.variantId));
        const changedVariants = result.nextState.variants.filter((variant) =>
          changedVariantIds.has(variant.id),
        );
        const remoteResult = await createSupabasePurchaseTransaction(stockIn, changedVariants);

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
