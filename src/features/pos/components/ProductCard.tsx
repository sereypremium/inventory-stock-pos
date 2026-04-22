import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import type { PosProductGroup } from '../types';
import { ProductCardImage } from './ProductCardImage';

interface ProductCardProps {
  product: PosProductGroup;
  cartQuantityMap: Record<string, number>;
  onSelectProduct: (product: PosProductGroup) => void;
  onQuickAddVariant: (variantId: string) => void;
}

export function ProductCard({
  product,
  cartQuantityMap,
  onSelectProduct,
  onQuickAddVariant,
}: ProductCardProps) {
  const variantsWithRemaining = product.variants.map((variant) => ({
    ...variant,
    remainingStock: Math.max(variant.stockQty - (cartQuantityMap[variant.id] ?? 0), 0),
  }));
  const availableVariants = variantsWithRemaining.filter((variant) => variant.remainingStock > 0);
  const quickAddVariant = availableVariants.length === 1 ? availableVariants[0] : null;
  const primaryVariant = availableVariants[0] ?? variantsWithRemaining[0] ?? null;
  const inCartQuantity = product.variants.reduce(
    (total, variant) => total + (cartQuantityMap[variant.id] ?? 0),
    0,
  );
  const totalRemainingStock = variantsWithRemaining.reduce(
    (total, variant) => total + variant.remainingStock,
    0,
  );
  const isOutOfStock = availableVariants.length === 0;

  return (
    <Card
      sx={{
        opacity: isOutOfStock ? 0.72 : 1,
        '@media (hover: hover) and (pointer: fine)': {
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
        sx={{
          alignItems: 'stretch',
          display: 'flex',
          height: '100%',
          justifyContent: 'stretch',
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            minHeight: { xs: 224, sm: 212 },
            width: '100%',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { xs: 'flex-start', sm: 'stretch' } }}
          >
            <ProductCardImage
              alt={product.product.name}
              imageUrl={product.product.imageUrl}
            />

            <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} variant="body1">
                    {product.product.name}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {product.brandName} | {product.product.styleCode}
                  </Typography>
                </Box>
                <Chip
                  color={isOutOfStock ? 'default' : 'success'}
                  label={
                    isOutOfStock
                      ? 'Out of stock'
                      : `${formatNumber(product.availableVariantCount)} variants`
                  }
                  size="small"
                  variant={isOutOfStock ? 'outlined' : 'filled'}
                />
              </Stack>

              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                <Chip
                  icon={<SellOutlinedIcon fontSize="small" />}
                  label={product.categoryName}
                  size="small"
                  variant="outlined"
                />
                {product.hasLowStock && (
                  <Chip
                    color="warning"
                    icon={<WarningAmberOutlinedIcon fontSize="small" />}
                    label="Low stock"
                    size="small"
                    variant="outlined"
                  />
                )}
                {inCartQuantity > 0 && (
                  <Chip
                    color="primary"
                    label={`In cart ${formatNumber(inCartQuantity)}`}
                    size="small"
                  />
                )}
              </Stack>

              {primaryVariant && (
                <Box
                  sx={{
                    backgroundColor: 'rgba(15, 91, 79, 0.04)',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1.1,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {primaryVariant.size} / {primaryVariant.color}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {primaryVariant.sku}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {formatCurrency(primaryVariant.sellingPrice)}
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Stack>
          </Stack>

          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {variantsWithRemaining.slice(0, 3).map((variant) => (
              <Chip
                key={variant.id}
                label={`${variant.size} / ${variant.color} (${formatNumber(variant.remainingStock)})`}
                size="small"
                variant="outlined"
              />
            ))}
            {product.variants.length > 3 && (
              <Chip
                label={`+${formatNumber(product.variants.length - 3)} more`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>

          <Box sx={{ mt: 'auto' }}>
            <Divider sx={{ mb: 1.25 }} />
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Starting price
                </Typography>
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  {formatCurrency(product.lowestPrice)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography color="text.secondary" variant="caption">
                  Remaining stock
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: 'center', justifyContent: 'flex-end' }}
                >
                  <Inventory2OutlinedIcon fontSize="small" />
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {formatNumber(totalRemainingStock)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </CardActionArea>

      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1.5 }}>
        <Button
          disabled={isOutOfStock}
          fullWidth
          onClick={(event) => {
            event.stopPropagation();

            if (quickAddVariant) {
              onQuickAddVariant(quickAddVariant.id);
              return;
            }

            onSelectProduct(product);
          }}
          size="large"
          startIcon={
            quickAddVariant ? <AddShoppingCartOutlinedIcon /> : <ArrowForwardOutlinedIcon />
          }
          variant={quickAddVariant ? 'contained' : 'outlined'}
        >
          {isOutOfStock ? 'Out of stock' : quickAddVariant ? 'Add to cart' : 'Choose variant'}
        </Button>
      </Box>
    </Card>
  );
}
