import type { Product, ProductVariant } from '../../types/models';

export interface PosCartLine {
  variantId: string;
  quantity: number;
}

export interface PosCartDetail {
  id: string;
  product: Product;
  variant: ProductVariant;
  brandName: string;
  categoryName: string;
  quantity: number;
  lineTotal: number;
}

export interface PosProductGroup {
  id: string;
  product: Product;
  brandName: string;
  categoryName: string;
  variants: ProductVariant[];
  totalStock: number;
  availableVariantCount: number;
  lowestPrice: number;
  hasLowStock: boolean;
  hasOutOfStock: boolean;
}
