import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import type { ProductVariant } from '../../../types/models';
import type { PosProductGroup } from '../types';
import { ProductCardImage } from './ProductCardImage';

interface ProductCardProps {
  product: PosProductGroup;
  cartQuantityMap: Record<string, number>;
  onSelectProduct: (product: PosProductGroup) => void;
  onQuickAddVariant: (variantId: string) => void;
}

type DisplayVariant = ProductVariant & {
  sale_price?: number | string | null;
  stock_qty?: number | string | null;
};

function getVariantSalePrice(variant: DisplayVariant) {
  const rawPrice = variant.sale_price ?? variant.sellingPrice;
  const price = Number(rawPrice);

  return Number.isFinite(price) && price > 0 ? price : null;
}

function getVariantStockQty(variant: DisplayVariant) {
  const stockQty = Number(variant.stock_qty ?? variant.stockQty);

  return Number.isFinite(stockQty) ? Math.max(stockQty, 0) : 0;
}

function getStartingPrice(variants: DisplayVariant[]) {
  const activePrices = variants
    .filter((variant) => variant.status === 'active')
    .map(getVariantSalePrice)
    .filter((price): price is number => price !== null);

  return activePrices.length > 0 ? Math.min(...activePrices) : null;
}

export function ProductCard({
  product,
  cartQuantityMap,
  onSelectProduct,
  onQuickAddVariant,
}: ProductCardProps) {
  const variantsWithRemaining = product.variants.map((variant) => {
    const stockQty = getVariantStockQty(variant);

    return {
      ...variant,
      stockQty,
      remainingStock: Math.max(stockQty - (cartQuantityMap[variant.id] ?? 0), 0),
    };
  });
  const availableVariants = variantsWithRemaining.filter((variant) => variant.remainingStock > 0);
  const quickAddVariant = availableVariants.length === 1 ? availableVariants[0] : null;
  const inCartQuantity = product.variants.reduce(
    (total, variant) => total + (cartQuantityMap[variant.id] ?? 0),
    0,
  );
  const totalRemainingStock = variantsWithRemaining.reduce(
    (total, variant) => total + variant.remainingStock,
    0,
  );
  const visibleVariantChips = variantsWithRemaining.slice(0, 4);
  const hiddenVariantCount = Math.max(variantsWithRemaining.length - visibleVariantChips.length, 0);
  const startingPrice = getStartingPrice(product.variants);
  const isOutOfStock = availableVariants.length === 0;

  return (
    <Card
      sx={{
        borderColor: 'divider',
        borderRadius: 1.5,
        boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
        opacity: isOutOfStock ? 0.68 : 1,
        overflow: 'hidden',
        transition: 'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': {
            borderColor: 'primary.light',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.1)',
            transform: 'translateY(-1px)',
          },
          '&:hover .pos-product-image-inner': {
            transform: 'scale(1.04)',
          },
        },
      }}
      variant="outlined"
    >
      <CardActionArea
        disabled={isOutOfStock}
        onClick={() => onSelectProduct(product)}
        sx={{ alignItems: 'stretch', display: 'block' }}
      >
        <CardContent sx={{ p: 1.25, pb: 1 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
            <ProductCardImage alt={product.product.name} imageUrl={product.product.imageUrl} />

            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    display: '-webkit-box',
                    fontSize: 14,
                    fontWeight: 800,
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                  }}
                >
                  {product.product.name}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    fontSize: 12,
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {product.brandName} • {product.product.styleCode}
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Chip
                  label={product.categoryName}
                  size="small"
                  sx={{
                    height: 22,
                    maxWidth: '100%',
                    '& .MuiChip-label': { fontSize: 11, px: 0.8 },
                  }}
                  variant="outlined"
                />
                <Chip
                  label={`${formatNumber(product.variants.length)} variants`}
                  size="small"
                  sx={{ height: 22, '& .MuiChip-label': { fontSize: 11, px: 0.8 } }}
                  variant="outlined"
                />
              </Stack>

              <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                <Inventory2OutlinedIcon color="action" sx={{ fontSize: 16 }} />
                <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 700 }}>
                  Stock {formatNumber(totalRemainingStock)}
                </Typography>
                {inCartQuantity > 0 && (
                  <Typography color="primary" sx={{ fontSize: 12, fontWeight: 800 }}>
                    In cart {formatNumber(inCartQuantity)}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{ flexWrap: 'wrap', gap: 0.5, mt: 1 }}
          >
            {visibleVariantChips.map((variant) => (
              <Chip
                key={variant.id}
                label={`${variant.size} / ${variant.color} (${formatNumber(variant.remainingStock)})`}
                size="small"
                sx={{
                  borderRadius: 1,
                  height: 22,
                  maxWidth: '100%',
                  '& .MuiChip-label': { fontSize: 11, px: 0.75 },
                }}
                variant="outlined"
              />
            ))}
            {hiddenVariantCount > 0 && (
              <Chip
                label={`+${formatNumber(hiddenVariantCount)} more`}
                size="small"
                sx={{
                  borderRadius: 1,
                  height: 22,
                  '& .MuiChip-label': { fontSize: 11, px: 0.75 },
                }}
                variant="outlined"
              />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between',
          px: 1.25,
          py: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.2 }}>
            From
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>
            {startingPrice === null ? 'No price' : formatCurrency(startingPrice)}
          </Typography>
        </Box>
        <Button
          disabled={isOutOfStock}
          onClick={(event) => {
            event.stopPropagation();

            if (quickAddVariant) {
              onQuickAddVariant(quickAddVariant.id);
              return;
            }

            onSelectProduct(product);
          }}
          size="small"
          startIcon={<AddShoppingCartOutlinedIcon />}
          sx={{ flexShrink: 0, minHeight: 34, px: 1.25 }}
          variant={quickAddVariant ? 'contained' : 'outlined'}
        >
          {isOutOfStock ? 'Out' : 'Add'}
        </Button>
      </Stack>
    </Card>
  );
}
